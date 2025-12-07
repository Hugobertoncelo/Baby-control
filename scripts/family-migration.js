const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const adjectives = [
  'adorable', 'fluffy', 'cuddly', 'tiny', 'fuzzy', 'sweet', 'playful', 'gentle', 'happy',
  'bouncy', 'sleepy', 'snuggly', 'cheerful', 'bubbly', 'cozy', 'merry', 'giggly', 'jolly',
  'silly', 'wiggly', 'charming', 'dainty', 'darling', 'precious', 'lovable', 'huggable',
  'perky', 'sprightly', 'twinkly', 'whimsical', 'delightful', 'friendly', 'joyful', 'peppy',
  'snuggable', 'squeaky', 'teeny', 'itty-bitty', 'little', 'mini', 'petite', 'pocket-sized',
  'wee', 'chubby', 'plump', 'pudgy', 'roly-poly', 'round', 'squishy', 'tubby'
];

const animals = [
  'kitten', 'puppy', 'bunny', 'duckling', 'chick', 'calf', 'lamb', 'piglet', 'fawn',
  'cub', 'foal', 'joey', 'owlet', 'panda', 'koala', 'hamster', 'hedgehog', 'otter',
  'chinchilla', 'squirrel', 'chipmunk', 'mouse', 'gerbil', 'ferret', 'meerkat', 'sloth',
  'penguin', 'seal', 'walrus', 'alpaca', 'llama', 'capybara', 'quokka', 'wombat', 'beaver',
  'mole', 'dormouse', 'shrew', 'vole', 'lemur', 'marmoset', 'tamarin', 'loris', 'tarsier',
  'gibbon', 'raccoon', 'skunk', 'badger', 'fox', 'wolf', 'coyote', 'dingo', 'jackal',
  'deer', 'moose', 'elk', 'caribou', 'gazelle', 'antelope', 'impala', 'zebra', 'giraffe',
  'okapi', 'hippo', 'rhino', 'elephant', 'manatee', 'dugong', 'dolphin', 'porpoise', 'whale',
  'narwhal', 'beluga', 'turtle', 'tortoise', 'terrapin', 'lizard', 'gecko', 'chameleon',
  'iguana', 'salamander', 'newt', 'axolotl', 'frog', 'toad', 'tadpole', 'fish', 'goldfish',
  'guppy', 'minnow', 'tetra', 'betta', 'angelfish', 'clownfish', 'seahorse', 'starfish',
  'jellyfish', 'crab', 'lobster', 'shrimp', 'snail', 'slug', 'butterfly', 'caterpillar',
  'ladybug', 'beetle', 'bumblebee', 'honeybee', 'dragonfly', 'firefly', 'grasshopper',
  'cricket', 'mantis', 'ant', 'spider', 'scorpion', 'robin', 'sparrow', 'finch', 'canary',
  'parakeet', 'parrot', 'macaw', 'cockatoo', 'toucan', 'hummingbird', 'chickadee', 'cardinal',
  'bluejay', 'woodpecker', 'duck', 'goose', 'swan', 'peacock', 'flamingo', 'stork', 'crane',
  'heron', 'pelican', 'seagull', 'puffin', 'owl', 'hawk', 'eagle', 'falcon', 'kestrel',
  'kiwi', 'ostrich', 'emu', 'platypus', 'echidna', 'armadillo', 'pangolin', 'aardvark'
];

function generateSlug() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adjective}-${animal}`;
}

function generateSlugWithNumber(digits = 4) {
  const baseSlug = generateSlug();
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return `${baseSlug}-${randomNumber}`;
}

const modelsToUpdate = [
  'baby',
  'caretaker',
  'settings',
  'sleepLog',
  'feedLog',
  'diaperLog',
  'moodLog',
  'note',
  'milestone',
  'pumpLog',
  'playLog',
  'bathLog',
  'measurement',
  'medicine',
  'medicineLog',
  'contact',
  'calendarEvent'
];

async function generateUniqueSlug() {
  let slug = '';
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    slug = generateSlug();
    try {
      const existingFamilies = await prisma.$queryRaw`
        SELECT * FROM "Family" WHERE slug = ${slug} LIMIT 1
      `;
      if (Array.isArray(existingFamilies) && existingFamilies.length === 0) {
        isUnique = true;
      }
    } catch (error) {
      console.log('Error checking slug uniqueness, assuming unique:', error.message);
      isUnique = true;
    }
    attempts++;
  }
  if (!isUnique) {
    attempts = 0;
    while (!isUnique && attempts < 10) {
      slug = generateSlugWithNumber();
      try {
        const existingFamilies = await prisma.$queryRaw`
          SELECT * FROM "Family" WHERE slug = ${slug} LIMIT 1
        `;
        if (Array.isArray(existingFamilies) && existingFamilies.length === 0) {
          isUnique = true;
        }
      } catch (error) {
        console.log('Error checking slug uniqueness, assuming unique:', error.message);
        isUnique = true;
      }
      attempts++;
    }
  }
  return slug;
}

async function updateDatabase() {
  try {
    console.log('Checking if family migration is needed...');
    const existingFamilies = await prisma.family.findMany({
      take: 1
    });
    if (existingFamilies.length > 0) {
      console.log('Family records already exist, no migration needed.');
      return;
    }
    const slug = await generateUniqueSlug();
    console.log(`Generated unique slug: ${slug}`);
    let familyName = 'My Family';
    try {
      const settings = await prisma.settings.findFirst();
      if (settings && settings.familyName) {
        familyName = settings.familyName;
      }
    } catch (error) {
      console.log('Error getting family name from settings:', error.message);
    }
    console.log(`Creating new family...`);
    const family = await prisma.family.create({
      data: {
        slug: slug,
        name: familyName,
        isActive: true
      }
    });
    const familyId = family.id;
    console.log(`Created new family with ID: ${familyId}`);
    console.log('Family record created successfully.');
    try {
      console.log('Creating family member relationships...');
      const familyMemberData = [];
      let systemCaretaker = await prisma.caretaker.findFirst({
        where: {
          loginId: '00',
          familyId: familyId
        }
      });
      if (!systemCaretaker) {
        console.log('Creating system caretaker...');
        let securityPin = '111222';
        try {
          const settings = await prisma.settings.findFirst();
          if (settings && settings.securityPin) {
            securityPin = settings.securityPin;
            console.log('Using security pin from settings table.');
          } else {
            console.log('No settings found or no security pin set, using default: 111222');
          }
        } catch (error) {
          console.log('Error reading security pin from settings, using default 111222:', error.message);
        }
        systemCaretaker = await prisma.caretaker.create({
          data: {
            loginId: '00',
            name: 'system',
            type: 'System Administrator',
            role: 'ADMIN',
            securityPin: securityPin,
            familyId: familyId
          }
        });
        console.log('System caretaker created successfully.');
      } else {
        console.log('System caretaker already exists in this family.');
      }
      const existingSystemMember = await prisma.familyMember.findFirst({
        where: {
          familyId: familyId,
          caretakerId: systemCaretaker.id
        }
      });
      if (!existingSystemMember) {
        familyMemberData.push({
          familyId: familyId,
          caretakerId: systemCaretaker.id,
          role: 'admin',
          joinedAt: new Date()
        });
      } else {
        console.log('System caretaker is already a family member.');
      }
      const caretakers = await prisma.caretaker.findMany({
        where: {
          deletedAt: null,
          loginId: { not: '00' }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      if (caretakers.length > 0) {
        console.log(`Found ${caretakers.length} caretakers to link to family.`);
        for (const caretaker of caretakers) {
          const existingMember = await prisma.familyMember.findFirst({
            where: {
              familyId: familyId,
              caretakerId: caretaker.id
            }
          });
          if (!existingMember) {
            let familyRole = 'member';
            if (caretaker.role === 'ADMIN') {
              familyRole = 'admin';
            }
            familyMemberData.push({
              familyId: familyId,
              caretakerId: caretaker.id,
              role: familyRole,
              joinedAt: new Date()
            });
          } else {
            console.log(`Caretaker ${caretaker.name} is already a family member.`);
          }
        }
      }
      if (familyMemberData.length > 0) {
        await prisma.familyMember.createMany({
          data: familyMemberData
        });
        console.log(`Created ${familyMemberData.length} family member relationships.`);
        console.log(`- ${familyMemberData.filter(fm => fm.role === 'admin').length} admin(s)`);
        console.log(`- ${familyMemberData.filter(fm => fm.role === 'member').length} member(s)`);
        console.log(`- System user included as admin`);
      } else {
        console.log('No family member relationships to create.');
      }
    } catch (error) {
      console.error('Error creating family member relationships:', error);
    }
    for (const model of modelsToUpdate) {
      try {
        console.log(`Updating ${model} records...`);
        const countQuery = `SELECT COUNT(*) as count FROM "${model.charAt(0).toUpperCase() + model.slice(1)}"`;
        const countResult = await prisma.$queryRawUnsafe(countQuery);
        const count = countResult[0]?.count || 0;
        if (count === 0) {
          console.log(`No ${model} records to update.`);
          continue;
        }
        const updateQuery = `UPDATE "${model.charAt(0).toUpperCase() + model.slice(1)}" SET "familyId" = '${familyId}' WHERE "familyId" IS NULL`;
        await prisma.$executeRawUnsafe(updateQuery);
        console.log(`Updated ${count} ${model} records.`);
      } catch (error) {
        console.error(`Error updating ${model} records:`, error);
      }
    }
    console.log('Database update for multi-family support completed successfully!');
  } catch (error) {
    console.error('Error updating database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateDatabase();
