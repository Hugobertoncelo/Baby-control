import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

const dateFieldsByModel = {
  Baby: ['birthDate', 'createdAt', 'updatedAt', 'deletedAt'],
  Caretaker: ['createdAt', 'updatedAt', 'deletedAt'],
  SleepLog: ['startTime', 'endTime', 'createdAt', 'updatedAt', 'deletedAt'],
  FeedLog: ['time', 'startTime', 'endTime', 'createdAt', 'updatedAt', 'deletedAt'],
  DiaperLog: ['time', 'createdAt', 'updatedAt', 'deletedAt'],
  MoodLog: ['time', 'createdAt', 'updatedAt', 'deletedAt'],
  Note: ['time', 'createdAt', 'updatedAt', 'deletedAt'],
  Settings: ['createdAt', 'updatedAt'],
  Milestone: ['date', 'createdAt', 'updatedAt', 'deletedAt'],
  PumpLog: ['startTime', 'endTime', 'createdAt', 'updatedAt', 'deletedAt'],
  PlayLog: ['startTime', 'endTime', 'createdAt', 'updatedAt', 'deletedAt'],
  BathLog: ['time', 'createdAt', 'updatedAt', 'deletedAt'],
  Measurement: ['date', 'createdAt', 'updatedAt', 'deletedAt'],
  Unit: ['createdAt', 'updatedAt']
};

function getSystemTimezone() {
  try {
    if (process.env.TZ) {
      return process.env.TZ;
    }
    if (process.platform === 'darwin') {
      const tzOutput = execSync('systemsetup -gettimezone').toString().trim();
      const match = tzOutput.match(/Time Zone: (.+)$/);
      if (match && match[1]) {
        return match[1];
      }
    } else if (process.platform === 'linux') {
      return execSync('cat /etc/timezone').toString().trim();
    }
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error detecting system timezone:', error);
    return 'UTC';
  }
}

function isUtcDate(date) {
  if (!(date instanceof Date)) {
    return false;
  }
  const isoString = date.toISOString();
  const utcDate = new Date(isoString);
  return date.getTime() === utcDate.getTime();
}

function toUtc(date) {
  return new Date(date.toISOString());
}

async function processModel(modelName) {
  console.log(`Processing ${modelName}...`);
  const dateFields = dateFieldsByModel[modelName];
  if (!dateFields || dateFields.length === 0) {
    console.log(`No date fields found for ${modelName}`);
    return;
  }
  const records = await prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)].findMany();
  console.log(`Found ${records.length} records for ${modelName}`);
  let updatedCount = 0;
  for (const record of records) {
    const updates = {};
    let needsUpdate = false;
    for (const field of dateFields) {
      const date = record[field];
      if (date && date instanceof Date) {
        if (!isUtcDate(date)) {
          updates[field] = toUtc(date);
          needsUpdate = true;
          console.log(`Converting ${field} for ${modelName} record ${record.id}`);
        }
      }
    }
    if (needsUpdate) {
      try {
        await prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)].update({
          where: { id: record.id },
          data: updates
        });
        updatedCount++;
      } catch (error) {
        console.error(`Error updating ${modelName} record ${record.id}:`, error);
      }
    }
  }
  console.log(`Updated ${updatedCount} records for ${modelName}`);
}

async function main() {
  console.log('Starting UTC date conversion...');
  console.log(`System timezone: ${getSystemTimezone()}`);
  for (const modelName of Object.keys(dateFieldsByModel)) {
    await processModel(modelName);
  }
  console.log('UTC date conversion complete!');
}

main()
  .catch(e => {
    console.error('Error in UTC date conversion:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
