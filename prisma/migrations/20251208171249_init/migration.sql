-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "SleepType" AS ENUM ('NAP', 'NIGHT_SLEEP');

-- CreateEnum
CREATE TYPE "SleepQuality" AS ENUM ('POOR', 'FAIR', 'GOOD', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "FeedType" AS ENUM ('BREAST', 'BOTTLE', 'SOLIDS');

-- CreateEnum
CREATE TYPE "BreastSide" AS ENUM ('LEFT', 'RIGHT');

-- CreateEnum
CREATE TYPE "DiaperType" AS ENUM ('WET', 'DIRTY', 'BOTH');

-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('HAPPY', 'CALM', 'FUSSY', 'CRYING');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MilestoneCategory" AS ENUM ('MOTOR', 'COGNITIVE', 'SOCIAL', 'LANGUAGE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PlayType" AS ENUM ('TUMMY_TIME', 'INDOOR_PLAY', 'OUTDOOR_PLAY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MeasurementType" AS ENUM ('HEIGHT', 'WEIGHT', 'HEAD_CIRCUMFERENCE', 'TEMPERATURE');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('APPOINTMENT', 'CARETAKER_SCHEDULE', 'REMINDER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RecurrencePattern" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BetaCampaignType" AS ENUM ('NOTIFICATION', 'UPDATE', 'WELCOME', 'REMINDER');

-- CreateEnum
CREATE TYPE "BetaEmailStatus" AS ENUM ('SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailProviderType" AS ENUM ('MANUAL_SFTP', 'SENDGRID', 'SMTP2GO');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "betaparticipant" BOOLEAN NOT NULL DEFAULT false,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "provider" TEXT,
    "providerId" TEXT,
    "stripeCustomerId" TEXT,
    "subscriptionId" TEXT,
    "planType" TEXT,
    "planExpires" TIMESTAMP(3),
    "trialEnds" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "familyId" TEXT,
    "caretakerId" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "accountId" TEXT,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "familyId" TEXT NOT NULL,
    "caretakerId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("familyId","caretakerId")
);

-- CreateTable
CREATE TABLE "Baby" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" "Gender",
    "inactive" BOOLEAN NOT NULL DEFAULT false,
    "feedWarningTime" TEXT NOT NULL DEFAULT '03:00',
    "diaperWarningTime" TEXT NOT NULL DEFAULT '02:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,

    CONSTRAINT "Baby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caretaker" (
    "id" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "inactive" BOOLEAN NOT NULL DEFAULT false,
    "securityPin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,
    "accountId" TEXT,

    CONSTRAINT "Caretaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SleepLog" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "type" "SleepType" NOT NULL,
    "location" TEXT,
    "quality" "SleepQuality",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,

    CONSTRAINT "SleepLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "unitAbbr" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "activityTypes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedLog" (
    "id" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "feedDuration" INTEGER,
    "type" "FeedType" NOT NULL,
    "amount" DOUBLE PRECISION,
    "unitAbbr" TEXT,
    "side" "BreastSide",
    "food" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,

    CONSTRAINT "FeedLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaperLog" (
    "id" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "type" "DiaperType" NOT NULL,
    "condition" TEXT,
    "color" TEXT,
    "blowout" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,

    CONSTRAINT "DiaperLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoodLog" (
    "id" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "mood" "Mood" NOT NULL,
    "intensity" INTEGER DEFAULT 3,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,

    CONSTRAINT "MoodLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "familyName" TEXT NOT NULL DEFAULT 'My Family',
    "securityPin" TEXT NOT NULL DEFAULT '111222',
    "authType" TEXT,
    "defaultBottleUnit" TEXT NOT NULL DEFAULT 'OZ',
    "defaultSolidsUnit" TEXT NOT NULL DEFAULT 'TBSP',
    "defaultHeightUnit" TEXT NOT NULL DEFAULT 'IN',
    "defaultWeightUnit" TEXT NOT NULL DEFAULT 'LB',
    "defaultTempUnit" TEXT NOT NULL DEFAULT 'F',
    "activitySettings" TEXT,
    "enableDebugTimer" BOOLEAN NOT NULL DEFAULT false,
    "enableDebugTimezone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "familyId" TEXT,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "MilestoneCategory" NOT NULL,
    "ageInDays" INTEGER,
    "photo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PumpLog" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "leftAmount" DOUBLE PRECISION,
    "rightAmount" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "unitAbbr" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,

    CONSTRAINT "PumpLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayLog" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "type" "PlayType" NOT NULL,
    "location" TEXT,
    "activities" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,

    CONSTRAINT "PlayLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BathLog" (
    "id" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "soapUsed" BOOLEAN NOT NULL DEFAULT true,
    "shampooUsed" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,

    CONSTRAINT "BathLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "MeasurementType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "type" "CalendarEventType" NOT NULL,
    "location" TEXT,
    "color" TEXT,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrencePattern" "RecurrencePattern",
    "recurrenceEnd" TIMESTAMP(3),
    "customRecurrence" TEXT,
    "reminderTime" INTEGER,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BabyEvent" (
    "babyId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "BabyEvent_pkey" PRIMARY KEY ("babyId","eventId")
);

-- CreateTable
CREATE TABLE "CaretakerEvent" (
    "caretakerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "CaretakerEvent_pkey" PRIMARY KEY ("caretakerId","eventId")
);

-- CreateTable
CREATE TABLE "ContactEvent" (
    "contactId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "ContactEvent_pkey" PRIMARY KEY ("contactId","eventId")
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "typicalDoseSize" DOUBLE PRECISION,
    "unitAbbr" TEXT,
    "doseMinTime" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineLog" (
    "id" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "doseAmount" DOUBLE PRECISION NOT NULL,
    "unitAbbr" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,
    "medicineId" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,

    CONSTRAINT "MedicineLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMedicine" (
    "contactId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,

    CONSTRAINT "ContactMedicine_pkey" PRIMARY KEY ("contactId","medicineId")
);

-- CreateTable
CREATE TABLE "FamilySetup" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "familyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilySetup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetaSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "isOptedIn" BOOLEAN NOT NULL DEFAULT true,
    "optedOutAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'coming-soon',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BetaSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetaCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT,
    "type" "BetaCampaignType" NOT NULL DEFAULT 'NOTIFICATION',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BetaCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetaCampaignEmail" (
    "id" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "status" "BetaEmailStatus" NOT NULL DEFAULT 'SENT',
    "errorMessage" TEXT,
    "campaignId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,

    CONSTRAINT "BetaCampaignEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL,
    "adminPass" TEXT NOT NULL,
    "rootDomain" TEXT NOT NULL,
    "enableHttps" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailConfig" (
    "id" TEXT NOT NULL,
    "providerType" "EmailProviderType" NOT NULL DEFAULT 'SENDGRID',
    "sendGridApiKey" TEXT,
    "smtp2goApiKey" TEXT,
    "serverAddress" TEXT,
    "port" INTEGER,
    "username" TEXT,
    "password" TEXT,
    "enableTls" BOOLEAN NOT NULL DEFAULT true,
    "allowSelfSignedCert" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoTracker" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "sourceFamilyId" TEXT NOT NULL,
    "dateRangeStart" TIMESTAMP(3) NOT NULL,
    "dateRangeEnd" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "DemoTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "familyId" TEXT,
    "accountId" TEXT,
    "caretakerId" TEXT,
    "submitterName" TEXT,
    "submitterEmail" TEXT,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_verificationToken_key" ON "Account"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "Account_passwordResetToken_key" ON "Account"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Account_familyId_key" ON "Account"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_caretakerId_key" ON "Account"("caretakerId");

-- CreateIndex
CREATE INDEX "Account_email_idx" ON "Account"("email");

-- CreateIndex
CREATE INDEX "Account_verified_idx" ON "Account"("verified");

-- CreateIndex
CREATE INDEX "Account_verificationToken_idx" ON "Account"("verificationToken");

-- CreateIndex
CREATE INDEX "Account_passwordResetToken_idx" ON "Account"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Family_slug_key" ON "Family"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Family_accountId_key" ON "Family"("accountId");

-- CreateIndex
CREATE INDEX "FamilyMember_familyId_idx" ON "FamilyMember"("familyId");

-- CreateIndex
CREATE INDEX "FamilyMember_caretakerId_idx" ON "FamilyMember"("caretakerId");

-- CreateIndex
CREATE INDEX "Baby_birthDate_idx" ON "Baby"("birthDate");

-- CreateIndex
CREATE INDEX "Baby_deletedAt_idx" ON "Baby"("deletedAt");

-- CreateIndex
CREATE INDEX "Baby_familyId_idx" ON "Baby"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "Caretaker_accountId_key" ON "Caretaker"("accountId");

-- CreateIndex
CREATE INDEX "Caretaker_deletedAt_idx" ON "Caretaker"("deletedAt");

-- CreateIndex
CREATE INDEX "Caretaker_familyId_idx" ON "Caretaker"("familyId");

-- CreateIndex
CREATE INDEX "Caretaker_accountId_idx" ON "Caretaker"("accountId");

-- CreateIndex
CREATE INDEX "SleepLog_startTime_idx" ON "SleepLog"("startTime");

-- CreateIndex
CREATE INDEX "SleepLog_endTime_idx" ON "SleepLog"("endTime");

-- CreateIndex
CREATE INDEX "SleepLog_babyId_idx" ON "SleepLog"("babyId");

-- CreateIndex
CREATE INDEX "SleepLog_caretakerId_idx" ON "SleepLog"("caretakerId");

-- CreateIndex
CREATE INDEX "SleepLog_deletedAt_idx" ON "SleepLog"("deletedAt");

-- CreateIndex
CREATE INDEX "SleepLog_familyId_idx" ON "SleepLog"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_unitAbbr_key" ON "Unit"("unitAbbr");

-- CreateIndex
CREATE INDEX "Unit_unitAbbr_idx" ON "Unit"("unitAbbr");

-- CreateIndex
CREATE INDEX "FeedLog_time_idx" ON "FeedLog"("time");

-- CreateIndex
CREATE INDEX "FeedLog_startTime_idx" ON "FeedLog"("startTime");

-- CreateIndex
CREATE INDEX "FeedLog_endTime_idx" ON "FeedLog"("endTime");

-- CreateIndex
CREATE INDEX "FeedLog_babyId_idx" ON "FeedLog"("babyId");

-- CreateIndex
CREATE INDEX "FeedLog_caretakerId_idx" ON "FeedLog"("caretakerId");

-- CreateIndex
CREATE INDEX "FeedLog_unitAbbr_idx" ON "FeedLog"("unitAbbr");

-- CreateIndex
CREATE INDEX "FeedLog_deletedAt_idx" ON "FeedLog"("deletedAt");

-- CreateIndex
CREATE INDEX "FeedLog_familyId_idx" ON "FeedLog"("familyId");

-- CreateIndex
CREATE INDEX "DiaperLog_time_idx" ON "DiaperLog"("time");

-- CreateIndex
CREATE INDEX "DiaperLog_babyId_idx" ON "DiaperLog"("babyId");

-- CreateIndex
CREATE INDEX "DiaperLog_caretakerId_idx" ON "DiaperLog"("caretakerId");

-- CreateIndex
CREATE INDEX "DiaperLog_deletedAt_idx" ON "DiaperLog"("deletedAt");

-- CreateIndex
CREATE INDEX "DiaperLog_familyId_idx" ON "DiaperLog"("familyId");

-- CreateIndex
CREATE INDEX "MoodLog_time_idx" ON "MoodLog"("time");

-- CreateIndex
CREATE INDEX "MoodLog_babyId_idx" ON "MoodLog"("babyId");

-- CreateIndex
CREATE INDEX "MoodLog_caretakerId_idx" ON "MoodLog"("caretakerId");

-- CreateIndex
CREATE INDEX "MoodLog_deletedAt_idx" ON "MoodLog"("deletedAt");

-- CreateIndex
CREATE INDEX "MoodLog_familyId_idx" ON "MoodLog"("familyId");

-- CreateIndex
CREATE INDEX "Note_time_idx" ON "Note"("time");

-- CreateIndex
CREATE INDEX "Note_babyId_idx" ON "Note"("babyId");

-- CreateIndex
CREATE INDEX "Note_caretakerId_idx" ON "Note"("caretakerId");

-- CreateIndex
CREATE INDEX "Note_deletedAt_idx" ON "Note"("deletedAt");

-- CreateIndex
CREATE INDEX "Note_familyId_idx" ON "Note"("familyId");

-- CreateIndex
CREATE INDEX "Settings_familyId_idx" ON "Settings"("familyId");

-- CreateIndex
CREATE INDEX "Milestone_date_idx" ON "Milestone"("date");

-- CreateIndex
CREATE INDEX "Milestone_babyId_idx" ON "Milestone"("babyId");

-- CreateIndex
CREATE INDEX "Milestone_caretakerId_idx" ON "Milestone"("caretakerId");

-- CreateIndex
CREATE INDEX "Milestone_deletedAt_idx" ON "Milestone"("deletedAt");

-- CreateIndex
CREATE INDEX "Milestone_familyId_idx" ON "Milestone"("familyId");

-- CreateIndex
CREATE INDEX "PumpLog_startTime_idx" ON "PumpLog"("startTime");

-- CreateIndex
CREATE INDEX "PumpLog_endTime_idx" ON "PumpLog"("endTime");

-- CreateIndex
CREATE INDEX "PumpLog_babyId_idx" ON "PumpLog"("babyId");

-- CreateIndex
CREATE INDEX "PumpLog_caretakerId_idx" ON "PumpLog"("caretakerId");

-- CreateIndex
CREATE INDEX "PumpLog_unitAbbr_idx" ON "PumpLog"("unitAbbr");

-- CreateIndex
CREATE INDEX "PumpLog_deletedAt_idx" ON "PumpLog"("deletedAt");

-- CreateIndex
CREATE INDEX "PumpLog_familyId_idx" ON "PumpLog"("familyId");

-- CreateIndex
CREATE INDEX "PlayLog_startTime_idx" ON "PlayLog"("startTime");

-- CreateIndex
CREATE INDEX "PlayLog_endTime_idx" ON "PlayLog"("endTime");

-- CreateIndex
CREATE INDEX "PlayLog_babyId_idx" ON "PlayLog"("babyId");

-- CreateIndex
CREATE INDEX "PlayLog_caretakerId_idx" ON "PlayLog"("caretakerId");

-- CreateIndex
CREATE INDEX "PlayLog_deletedAt_idx" ON "PlayLog"("deletedAt");

-- CreateIndex
CREATE INDEX "PlayLog_familyId_idx" ON "PlayLog"("familyId");

-- CreateIndex
CREATE INDEX "BathLog_time_idx" ON "BathLog"("time");

-- CreateIndex
CREATE INDEX "BathLog_babyId_idx" ON "BathLog"("babyId");

-- CreateIndex
CREATE INDEX "BathLog_caretakerId_idx" ON "BathLog"("caretakerId");

-- CreateIndex
CREATE INDEX "BathLog_deletedAt_idx" ON "BathLog"("deletedAt");

-- CreateIndex
CREATE INDEX "BathLog_familyId_idx" ON "BathLog"("familyId");

-- CreateIndex
CREATE INDEX "Measurement_date_idx" ON "Measurement"("date");

-- CreateIndex
CREATE INDEX "Measurement_type_idx" ON "Measurement"("type");

-- CreateIndex
CREATE INDEX "Measurement_babyId_idx" ON "Measurement"("babyId");

-- CreateIndex
CREATE INDEX "Measurement_caretakerId_idx" ON "Measurement"("caretakerId");

-- CreateIndex
CREATE INDEX "Measurement_deletedAt_idx" ON "Measurement"("deletedAt");

-- CreateIndex
CREATE INDEX "Measurement_familyId_idx" ON "Measurement"("familyId");

-- CreateIndex
CREATE INDEX "Contact_role_idx" ON "Contact"("role");

-- CreateIndex
CREATE INDEX "Contact_deletedAt_idx" ON "Contact"("deletedAt");

-- CreateIndex
CREATE INDEX "Contact_familyId_idx" ON "Contact"("familyId");

-- CreateIndex
CREATE INDEX "CalendarEvent_startTime_idx" ON "CalendarEvent"("startTime");

-- CreateIndex
CREATE INDEX "CalendarEvent_endTime_idx" ON "CalendarEvent"("endTime");

-- CreateIndex
CREATE INDEX "CalendarEvent_type_idx" ON "CalendarEvent"("type");

-- CreateIndex
CREATE INDEX "CalendarEvent_recurring_idx" ON "CalendarEvent"("recurring");

-- CreateIndex
CREATE INDEX "CalendarEvent_deletedAt_idx" ON "CalendarEvent"("deletedAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_familyId_idx" ON "CalendarEvent"("familyId");

-- CreateIndex
CREATE INDEX "BabyEvent_babyId_idx" ON "BabyEvent"("babyId");

-- CreateIndex
CREATE INDEX "BabyEvent_eventId_idx" ON "BabyEvent"("eventId");

-- CreateIndex
CREATE INDEX "CaretakerEvent_caretakerId_idx" ON "CaretakerEvent"("caretakerId");

-- CreateIndex
CREATE INDEX "CaretakerEvent_eventId_idx" ON "CaretakerEvent"("eventId");

-- CreateIndex
CREATE INDEX "ContactEvent_contactId_idx" ON "ContactEvent"("contactId");

-- CreateIndex
CREATE INDEX "ContactEvent_eventId_idx" ON "ContactEvent"("eventId");

-- CreateIndex
CREATE INDEX "Medicine_name_idx" ON "Medicine"("name");

-- CreateIndex
CREATE INDEX "Medicine_active_idx" ON "Medicine"("active");

-- CreateIndex
CREATE INDEX "Medicine_unitAbbr_idx" ON "Medicine"("unitAbbr");

-- CreateIndex
CREATE INDEX "Medicine_deletedAt_idx" ON "Medicine"("deletedAt");

-- CreateIndex
CREATE INDEX "Medicine_familyId_idx" ON "Medicine"("familyId");

-- CreateIndex
CREATE INDEX "MedicineLog_time_idx" ON "MedicineLog"("time");

-- CreateIndex
CREATE INDEX "MedicineLog_medicineId_idx" ON "MedicineLog"("medicineId");

-- CreateIndex
CREATE INDEX "MedicineLog_babyId_idx" ON "MedicineLog"("babyId");

-- CreateIndex
CREATE INDEX "MedicineLog_caretakerId_idx" ON "MedicineLog"("caretakerId");

-- CreateIndex
CREATE INDEX "MedicineLog_unitAbbr_idx" ON "MedicineLog"("unitAbbr");

-- CreateIndex
CREATE INDEX "MedicineLog_deletedAt_idx" ON "MedicineLog"("deletedAt");

-- CreateIndex
CREATE INDEX "MedicineLog_familyId_idx" ON "MedicineLog"("familyId");

-- CreateIndex
CREATE INDEX "ContactMedicine_contactId_idx" ON "ContactMedicine"("contactId");

-- CreateIndex
CREATE INDEX "ContactMedicine_medicineId_idx" ON "ContactMedicine"("medicineId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilySetup_token_key" ON "FamilySetup"("token");

-- CreateIndex
CREATE UNIQUE INDEX "FamilySetup_familyId_key" ON "FamilySetup"("familyId");

-- CreateIndex
CREATE INDEX "FamilySetup_createdBy_idx" ON "FamilySetup"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "BetaSubscriber_email_key" ON "BetaSubscriber"("email");

-- CreateIndex
CREATE INDEX "BetaSubscriber_email_idx" ON "BetaSubscriber"("email");

-- CreateIndex
CREATE INDEX "BetaSubscriber_isOptedIn_idx" ON "BetaSubscriber"("isOptedIn");

-- CreateIndex
CREATE INDEX "BetaSubscriber_source_idx" ON "BetaSubscriber"("source");

-- CreateIndex
CREATE INDEX "BetaSubscriber_createdAt_idx" ON "BetaSubscriber"("createdAt");

-- CreateIndex
CREATE INDEX "BetaSubscriber_deletedAt_idx" ON "BetaSubscriber"("deletedAt");

-- CreateIndex
CREATE INDEX "BetaCampaign_type_idx" ON "BetaCampaign"("type");

-- CreateIndex
CREATE INDEX "BetaCampaign_isActive_idx" ON "BetaCampaign"("isActive");

-- CreateIndex
CREATE INDEX "BetaCampaign_scheduledAt_idx" ON "BetaCampaign"("scheduledAt");

-- CreateIndex
CREATE INDEX "BetaCampaign_createdAt_idx" ON "BetaCampaign"("createdAt");

-- CreateIndex
CREATE INDEX "BetaCampaign_deletedAt_idx" ON "BetaCampaign"("deletedAt");

-- CreateIndex
CREATE INDEX "BetaCampaignEmail_sentAt_idx" ON "BetaCampaignEmail"("sentAt");

-- CreateIndex
CREATE INDEX "BetaCampaignEmail_status_idx" ON "BetaCampaignEmail"("status");

-- CreateIndex
CREATE INDEX "BetaCampaignEmail_campaignId_idx" ON "BetaCampaignEmail"("campaignId");

-- CreateIndex
CREATE INDEX "BetaCampaignEmail_subscriberId_idx" ON "BetaCampaignEmail"("subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "BetaCampaignEmail_campaignId_subscriberId_key" ON "BetaCampaignEmail"("campaignId", "subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "DemoTracker_familyId_key" ON "DemoTracker"("familyId");

-- CreateIndex
CREATE INDEX "DemoTracker_generatedAt_idx" ON "DemoTracker"("generatedAt");

-- CreateIndex
CREATE INDEX "DemoTracker_lastAccessedAt_idx" ON "DemoTracker"("lastAccessedAt");

-- CreateIndex
CREATE INDEX "Feedback_submittedAt_idx" ON "Feedback"("submittedAt");

-- CreateIndex
CREATE INDEX "Feedback_viewed_idx" ON "Feedback"("viewed");

-- CreateIndex
CREATE INDEX "Feedback_familyId_idx" ON "Feedback"("familyId");

-- CreateIndex
CREATE INDEX "Feedback_accountId_idx" ON "Feedback"("accountId");

-- CreateIndex
CREATE INDEX "Feedback_caretakerId_idx" ON "Feedback"("caretakerId");

-- CreateIndex
CREATE INDEX "Feedback_deletedAt_idx" ON "Feedback"("deletedAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Baby" ADD CONSTRAINT "Baby_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caretaker" ADD CONSTRAINT "Caretaker_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SleepLog" ADD CONSTRAINT "SleepLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SleepLog" ADD CONSTRAINT "SleepLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SleepLog" ADD CONSTRAINT "SleepLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedLog" ADD CONSTRAINT "FeedLog_unitAbbr_fkey" FOREIGN KEY ("unitAbbr") REFERENCES "Unit"("unitAbbr") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedLog" ADD CONSTRAINT "FeedLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedLog" ADD CONSTRAINT "FeedLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedLog" ADD CONSTRAINT "FeedLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaperLog" ADD CONSTRAINT "DiaperLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaperLog" ADD CONSTRAINT "DiaperLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaperLog" ADD CONSTRAINT "DiaperLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoodLog" ADD CONSTRAINT "MoodLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoodLog" ADD CONSTRAINT "MoodLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoodLog" ADD CONSTRAINT "MoodLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PumpLog" ADD CONSTRAINT "PumpLog_unitAbbr_fkey" FOREIGN KEY ("unitAbbr") REFERENCES "Unit"("unitAbbr") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PumpLog" ADD CONSTRAINT "PumpLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PumpLog" ADD CONSTRAINT "PumpLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PumpLog" ADD CONSTRAINT "PumpLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayLog" ADD CONSTRAINT "PlayLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayLog" ADD CONSTRAINT "PlayLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayLog" ADD CONSTRAINT "PlayLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BathLog" ADD CONSTRAINT "BathLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BathLog" ADD CONSTRAINT "BathLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BathLog" ADD CONSTRAINT "BathLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BabyEvent" ADD CONSTRAINT "BabyEvent_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BabyEvent" ADD CONSTRAINT "BabyEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaretakerEvent" ADD CONSTRAINT "CaretakerEvent_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaretakerEvent" ADD CONSTRAINT "CaretakerEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactEvent" ADD CONSTRAINT "ContactEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactEvent" ADD CONSTRAINT "ContactEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_unitAbbr_fkey" FOREIGN KEY ("unitAbbr") REFERENCES "Unit"("unitAbbr") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineLog" ADD CONSTRAINT "MedicineLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineLog" ADD CONSTRAINT "MedicineLog_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineLog" ADD CONSTRAINT "MedicineLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineLog" ADD CONSTRAINT "MedicineLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineLog" ADD CONSTRAINT "MedicineLog_unitAbbr_fkey" FOREIGN KEY ("unitAbbr") REFERENCES "Unit"("unitAbbr") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactMedicine" ADD CONSTRAINT "ContactMedicine_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactMedicine" ADD CONSTRAINT "ContactMedicine_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilySetup" ADD CONSTRAINT "FamilySetup_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Caretaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilySetup" ADD CONSTRAINT "FamilySetup_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetaCampaignEmail" ADD CONSTRAINT "BetaCampaignEmail_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "BetaCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetaCampaignEmail" ADD CONSTRAINT "BetaCampaignEmail_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "BetaSubscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
