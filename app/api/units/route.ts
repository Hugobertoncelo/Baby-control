import { NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse } from "../types";
import { Unit } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activityType = searchParams.get("activityType");

    const allUnits = await prisma.unit.findMany({
      select: {
        id: true,
        unitAbbr: true,
        unitName: true,
        activityTypes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        unitName: "asc",
      },
    });

    let filteredUnits = allUnits;
    if (activityType) {
      const activityTypeLower = activityType.toLowerCase();
      filteredUnits = allUnits.filter((unit) => {
        if (!unit.activityTypes) {
          return false;
        }
        const unitTypesLower = unit.activityTypes.toLowerCase();
        return unitTypesLower.includes(activityTypeLower);
      });
      if (filteredUnits.length === 0) {
        filteredUnits = allUnits;
      }
    }

    return NextResponse.json<ApiResponse<Unit[]>>({
      success: true,
      data: filteredUnits,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<Unit[]>>(
      {
        success: false,
        error: "Falha ao buscar unidades",
      },
      { status: 500 }
    );
  }
}
