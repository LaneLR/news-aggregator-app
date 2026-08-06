// Seeds test accounts into the database for manual testing.
// Usage: npm run seed
//
// Refuses to run unless NODE_ENV is "development" so it can't accidentally
// be pointed at a production DATABASE_URL.
import "dotenv/config";
import initializeDbAndModels from "../lib/db.js";

const TEST_PASSWORD = "TestPass123!";

const DEMO_USERS = [
  {
    email: "abc123@email.com",
    password: TEST_PASSWORD,
    tier: "Subscribed",
    name: "Test Subscriber",
  },
  {
    email: "free-test@email.com",
    password: TEST_PASSWORD,
    tier: "Free",
    name: "Test Free User",
  },
];

async function seed() {
  if (process.env.NODE_ENV !== "development") {
    console.error(
      "Refusing to seed: NODE_ENV is not 'development'. " +
        "Set NODE_ENV=development if you really want to seed this database."
    );
    process.exit(1);
  }

  const { User, sequelize } = await initializeDbAndModels();

  for (const demoUser of DEMO_USERS) {
    const [user, created] = await User.findOrCreate({
      where: { email: demoUser.email },
      defaults: {
        password: demoUser.password,
        tier: demoUser.tier,
        name: demoUser.name,
        emailIsVerified: true,
      },
    });

    // findOrCreate only applies defaults on creation — force these test
    // accounts into a known-good state even if they already existed
    // (e.g. re-running the seed after a schema change).
    if (!created) {
      user.tier = demoUser.tier;
      user.emailIsVerified = true;
      user.status = "active";
      user.isPendingDeletion = false;
      await user.save();
    }

    console.log(
      created ? `Created ${user.email}` : `Reset existing account: ${user.email}`
    );
  }

  await sequelize.close();
  console.log("Done.");
  console.log(`\nTest login (all seeded accounts): password is "${TEST_PASSWORD}"`);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
