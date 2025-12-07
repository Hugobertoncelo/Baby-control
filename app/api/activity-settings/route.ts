import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse, ActivitySettings } from "../types";
import { withAuthContext, AuthResult } from "../utils/auth";

async function getActivitySettings(
  req: NextRequest,
  authContext: AuthResult
): Promise<NextResponse<ApiResponse<ActivitySettings | null>>> {
  try {
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const url = new URL(req.url);
    const caretakerId = url.searchParams.get("caretakerId");
    const defaultSettings: ActivitySettings = {
      order: [
        "sleep",
        "feed",
        "diaper",
        "note",
        "bath",
        "pump",
        "measurement",
        "milestone",
        "medicine",
      ],
      visible: [
        "sleep",
        "feed",
        "diaper",
        "note",
        "bath",
        "pump",
        "measurement",
        "milestone",
        "medicine",
      ],
      caretakerId: caretakerId || null,
    };
    const settings = await prisma.settings.findFirst({
      where: { familyId: userFamilyId },
      orderBy: { updatedAt: "desc" },
    });
    if (!settings) {
      return NextResponse.json({ success: true, data: defaultSettings });
    }
    const settingsWithActivity = settings as unknown as typeof settings & {
      activitySettings?: string;
    };
    if (!settingsWithActivity.activitySettings) {
      return NextResponse.json({ success: true, data: defaultSettings });
    }
    let allSettings: Record<string, { order: string[]; visible: string[] }>;
    try {
      allSettings = JSON.parse(settingsWithActivity.activitySettings);
    } catch (parseError) {
      return NextResponse.json({ success: true, data: defaultSettings });
    }
    if (caretakerId) {
      if (allSettings[caretakerId]) {
        const caretakerSettings = allSettings[caretakerId];
        const defaultActivities = defaultSettings.order;
        const missingActivities = defaultActivities.filter(
          (activity) => !caretakerSettings.order.includes(activity)
        );
        if (missingActivities.length > 0) {
          const updatedOrder = [
            ...caretakerSettings.order,
            ...missingActivities,
          ];
          const updatedVisible = [...caretakerSettings.visible];
          for (const activity of missingActivities) {
            if (
              defaultSettings.visible.includes(activity) &&
              !updatedVisible.includes(activity)
            ) {
              updatedVisible.push(activity);
            }
          }
          allSettings[caretakerId] = {
            order: updatedOrder,
            visible: updatedVisible,
          };
          await prisma.settings.update({
            where: { id: settings.id },
            data: {
              ...({ activitySettings: JSON.stringify(allSettings) } as any),
            },
          });
          return NextResponse.json({
            success: true,
            data: {
              order: updatedOrder,
              visible: updatedVisible,
              caretakerId,
            },
          });
        }
        return NextResponse.json({
          success: true,
          data: {
            ...allSettings[caretakerId],
            caretakerId,
          },
        });
      }
      if (allSettings.global) {
        const globalSettings = allSettings.global;
        const defaultActivities = defaultSettings.order;
        const missingActivities = defaultActivities.filter(
          (activity) => !globalSettings.order.includes(activity)
        );
        const caretakerOrder = [...globalSettings.order];
        const caretakerVisible = [...globalSettings.visible];
        let settingsUpdated = false;
        if (missingActivities.length > 0) {
          for (const activity of missingActivities) {
            caretakerOrder.push(activity);
            if (
              defaultSettings.visible.includes(activity) &&
              !caretakerVisible.includes(activity)
            ) {
              caretakerVisible.push(activity);
            }
          }
          settingsUpdated = true;
        }
        allSettings[caretakerId] = {
          order: caretakerOrder,
          visible: caretakerVisible,
        };
        if (settingsUpdated) {
          await prisma.settings.update({
            where: { id: settings.id },
            data: {
              ...({ activitySettings: JSON.stringify(allSettings) } as any),
            },
          });
        }
        return NextResponse.json({
          success: true,
          data: {
            order: caretakerOrder,
            visible: caretakerVisible,
            caretakerId,
          },
        });
      }
    }
    if (allSettings.global) {
      const globalSettings = allSettings.global;
      const defaultActivities = defaultSettings.order;
      const missingActivities = defaultActivities.filter(
        (activity) => !globalSettings.order.includes(activity)
      );
      if (missingActivities.length > 0) {
        const updatedOrder = [...globalSettings.order, ...missingActivities];
        const updatedVisible = [...globalSettings.visible];
        for (const activity of missingActivities) {
          if (
            defaultSettings.visible.includes(activity) &&
            !updatedVisible.includes(activity)
          ) {
            updatedVisible.push(activity);
          }
        }
        allSettings.global = {
          order: updatedOrder,
          visible: updatedVisible,
        };
        await prisma.settings.update({
          where: { id: settings.id },
          data: {
            ...({ activitySettings: JSON.stringify(allSettings) } as any),
          },
        });
        return NextResponse.json({
          success: true,
          data: {
            order: updatedOrder,
            visible: updatedVisible,
            caretakerId: null,
          },
        });
      }
    }
    return NextResponse.json({
      success: true,
      data: {
        ...(allSettings.global || defaultSettings),
        caretakerId: null,
      },
    });
  } catch (error) {
    const url = new URL(req.url);
    const errorCaretakerId = url.searchParams.get("caretakerId");
    return NextResponse.json({
      success: true,
      data: {
        order: [
          "sleep",
          "feed",
          "diaper",
          "note",
          "bath",
          "pump",
          "measurement",
          "milestone",
          "medicine",
        ],
        visible: [
          "sleep",
          "feed",
          "diaper",
          "note",
          "bath",
          "pump",
          "measurement",
          "milestone",
          "medicine",
        ],
        caretakerId: errorCaretakerId || null,
      },
    });
  }
}

async function saveActivitySettings(
  req: NextRequest,
  authContext: AuthResult
): Promise<NextResponse<ApiResponse<ActivitySettings | null>>> {
  try {
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const body = await req.json();
    const { order, visible, caretakerId } = body as ActivitySettings;
    if (
      !order ||
      !Array.isArray(order) ||
      !visible ||
      !Array.isArray(visible)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Formato de configurações de atividades inválido",
        },
        { status: 400 }
      );
    }
    const defaultActivities = [
      "sleep",
      "feed",
      "diaper",
      "note",
      "bath",
      "pump",
      "measurement",
      "milestone",
      "medicine",
    ];
    const missingActivities = defaultActivities.filter(
      (activity) => !order.includes(activity)
    );
    let updatedOrder = [...order];
    let updatedVisible = [...visible];
    if (missingActivities.length > 0) {
      for (const activity of missingActivities) {
        updatedOrder.push(activity);
        if (
          defaultActivities.includes(activity) &&
          !updatedVisible.includes(activity)
        ) {
          updatedVisible.push(activity);
        }
      }
    }
    let currentSettings = await prisma.settings.findFirst({
      where: { familyId: userFamilyId },
      orderBy: { updatedAt: "desc" },
    });
    if (!currentSettings) {
      currentSettings = await prisma.settings.create({
        data: {
          familyId: userFamilyId,
          familyName: "Minha Família",
          securityPin: "111222",
          defaultBottleUnit: "OZ",
          defaultSolidsUnit: "TBSP",
          defaultHeightUnit: "IN",
          defaultWeightUnit: "LB",
          defaultTempUnit: "F",
          activitySettings: JSON.stringify({
            global: {
              order: [
                "sleep",
                "feed",
                "diaper",
                "note",
                "bath",
                "pump",
                "measurement",
                "milestone",
                "medicine",
              ],
              visible: [
                "sleep",
                "feed",
                "diaper",
                "note",
                "bath",
                "pump",
                "measurement",
                "milestone",
                "medicine",
              ],
            },
          }),
        },
      });
    }
    const currentSettingsWithActivity =
      currentSettings as unknown as typeof currentSettings & {
        activitySettings?: string;
      };
    let allSettings: Record<string, { order: string[]; visible: string[] }> =
      {};
    if (currentSettingsWithActivity?.activitySettings) {
      try {
        allSettings = JSON.parse(currentSettingsWithActivity.activitySettings);
      } catch (e) {
        allSettings = {};
      }
    }
    const settingsKey = caretakerId || "global";
    const newSettings = {
      ...allSettings,
      [settingsKey]: {
        order: updatedOrder,
        visible: updatedVisible,
      },
    };
    allSettings = newSettings;
    const updatedSettings = await prisma.settings.update({
      where: { id: currentSettings.id },
      data: {
        ...({ activitySettings: JSON.stringify(allSettings) } as any),
      },
    });
    return NextResponse.json({
      success: true,
      data: {
        order: updatedOrder,
        visible: updatedVisible,
        caretakerId: caretakerId || null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Falha ao salvar configurações de atividades" },
      { status: 500 }
    );
  }
}

export const GET = withAuthContext(getActivitySettings);
export const POST = withAuthContext(saveActivitySettings);
