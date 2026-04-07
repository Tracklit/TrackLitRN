import { eq, and } from "drizzle-orm";
import { db, pool } from "../db";
import { users, trainingPrograms, programSessions } from "@shared/schema";

type SampleSession = {
  dayNumber: number;
  title: string;
  description: string;
  isRestDay: boolean;
};

type SampleProgram = {
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  sessions: SampleSession[];
};

const SAMPLE_PROGRAMS: SampleProgram[] = [
  {
    title: "Sprint Foundations (8 weeks)",
    description: "Build the base: acceleration mechanics, top-speed drills, and tempo work.",
    category: "sprint",
    level: "beginner",
    duration: 56,
    sessions: [
      { dayNumber: 1, title: "Acceleration Mechanics", description: "4x20m wall drills + 4x30m build-ups.", isRestDay: false },
      { dayNumber: 2, title: "Tempo Run", description: "6x150m @ 75% with 90s rest.", isRestDay: false },
      { dayNumber: 3, title: "Rest / Mobility", description: "Foam roll + 20min easy walk.", isRestDay: true },
      { dayNumber: 4, title: "Speed Endurance", description: "4x60m flying sprints, full recovery.", isRestDay: false },
      { dayNumber: 5, title: "Plyometric Base", description: "3x10 pogo hops, 3x6 broad jumps.", isRestDay: false },
      { dayNumber: 6, title: "Long Tempo", description: "5x200m @ 70% with 2min rest.", isRestDay: false },
    ],
  },
  {
    title: "400m Race Prep (6 weeks)",
    description: "Race-specific lactate tolerance and speed reserve for the 400m.",
    category: "sprint",
    level: "advanced",
    duration: 42,
    sessions: [
      { dayNumber: 1, title: "Speed Day", description: "3x(3x60m) at race pace, 3min/6min rest.", isRestDay: false },
      { dayNumber: 2, title: "Lactate Tolerance", description: "2x(300m + 150m), 10min between sets.", isRestDay: false },
      { dayNumber: 3, title: "Rest", description: "Active recovery swim or bike 30min.", isRestDay: true },
      { dayNumber: 4, title: "Special Endurance", description: "1x500m + 1x350m + 1x200m, 15min rest.", isRestDay: false },
      { dayNumber: 5, title: "Time Trial", description: "1x350m at 95%, then 4x100m strides.", isRestDay: false },
    ],
  },
  {
    title: "Off-Season Strength (12 weeks)",
    description: "Hypertrophy to max strength progression for explosive power.",
    category: "strength",
    level: "intermediate",
    duration: 84,
    sessions: [
      { dayNumber: 1, title: "Lower Body: Squat Focus", description: "Back squat 5x5, RDL 4x8, walking lunges 3x10/side.", isRestDay: false },
      { dayNumber: 2, title: "Upper Body: Push", description: "Bench 5x5, overhead press 4x6, dips 3xAMRAP.", isRestDay: false },
      { dayNumber: 3, title: "Rest", description: "Full recovery day.", isRestDay: true },
      { dayNumber: 4, title: "Lower Body: Posterior", description: "Deadlift 5x3, hip thrust 4x8, hamstring curl 3x12.", isRestDay: false },
      { dayNumber: 5, title: "Upper Body: Pull", description: "Pull-ups 5x5, barbell row 4x6, face pulls 3x15.", isRestDay: false },
      { dayNumber: 6, title: "Conditioning", description: "6x30s hill sprints with walk-back recovery.", isRestDay: false },
      { dayNumber: 7, title: "Rest", description: "Mobility and stretching.", isRestDay: true },
      { dayNumber: 8, title: "Olympic Lift Day", description: "Power clean 5x3, push press 4x5, front squat 4x6.", isRestDay: false },
    ],
  },
  {
    title: "Jumps & Plyometrics (4 weeks)",
    description: "Reactive strength and elastic power for jumpers and sprinters.",
    category: "jumps",
    level: "intermediate",
    duration: 28,
    sessions: [
      { dayNumber: 1, title: "Extensive Plyos", description: "4x10 pogos, 3x10 split jumps, 3x8 tuck jumps.", isRestDay: false },
      { dayNumber: 2, title: "Bounds + Sprints", description: "5x20m bounds, 4x40m sprints from 3-point.", isRestDay: false },
      { dayNumber: 3, title: "Intensive Plyos", description: "5x3 depth jumps, 4x3 single-leg bounds.", isRestDay: false },
      { dayNumber: 4, title: "Jump Approaches", description: "6x3 long jump approaches, focus on penultimate.", isRestDay: false },
    ],
  },
];

const PROD_URL_NEEDLES = ["azure", "amazonaws", "prod", "tracklit-prod"];

async function main() {
  // Safety rail 1: never run in production NODE_ENV.
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to run in production");
    process.exit(1);
  }

  // Safety rail 2: refuse any DATABASE_URL that looks like a managed/prod host.
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const lowerUrl = databaseUrl.toLowerCase();
  const matched = PROD_URL_NEEDLES.find((needle) => lowerUrl.includes(needle));
  if (matched) {
    console.error(
      `Refusing to run: DATABASE_URL contains "${matched}" which looks like a production host.`,
    );
    process.exit(1);
  }

  // Safety rail 3: dry-run is the default; --confirm is required to write.
  const confirm = process.argv.includes("--confirm");

  // Safety rail 4: require SEED_COACH_EMAIL to scope inserts to a single user.
  const coachEmail = process.env.SEED_COACH_EMAIL;
  if (!coachEmail) {
    console.error(
      "SEED_COACH_EMAIL is not set. Set it to the coach's email, e.g. SEED_COACH_EMAIL=coach@example.com",
    );
    process.exit(1);
  }

  const coachRows = await db
    .select()
    .from(users)
    .where(eq(users.email, coachEmail))
    .limit(1);

  const coach = coachRows[0];
  if (!coach) {
    console.error(`No user found with email ${coachEmail}`);
    process.exit(1);
  }

  console.log(
    `Found coach: id=${coach.id}, username=${coach.username}, isCoach=${coach.isCoach}`,
  );

  if (!confirm) {
    console.log("[DRY-RUN] No --confirm flag; will not write to the database.");
  }

  let inserted = 0;
  let skipped = 0;
  let totalSessionsInserted = 0;

  if (!confirm) {
    for (const sample of SAMPLE_PROGRAMS) {
      const existing = await db
        .select({ id: trainingPrograms.id })
        .from(trainingPrograms)
        .where(
          and(
            eq(trainingPrograms.userId, coach.id),
            eq(trainingPrograms.title, sample.title),
          ),
        )
        .limit(1);

      if (existing[0]) {
        console.log(`[DRY-RUN] Would skip "${sample.title}" (already exists)`);
        skipped += 1;
      } else {
        console.log(
          `[DRY-RUN] Would insert "${sample.title}" (${sample.sessions.length} sessions)`,
        );
        inserted += 1;
        totalSessionsInserted += sample.sessions.length;
      }
    }

    console.log(
      `[DRY-RUN] Would insert ${inserted} programs, ${totalSessionsInserted} sessions. Skipped ${skipped}. Pass --confirm to actually write.`,
    );
    return;
  }

  await db.transaction(async (tx) => {
    for (const sample of SAMPLE_PROGRAMS) {
      const existing = await tx
        .select({ id: trainingPrograms.id })
        .from(trainingPrograms)
        .where(
          and(
            eq(trainingPrograms.userId, coach.id),
            eq(trainingPrograms.title, sample.title),
          ),
        )
        .limit(1);

      if (existing[0]) {
        console.log(`Skipped "${sample.title}" (already exists)`);
        skipped += 1;
        continue;
      }

      const [program] = await tx
        .insert(trainingPrograms)
        .values({
          userId: coach.id,
          title: sample.title,
          description: sample.description,
          visibility: "private",
          category: sample.category,
          level: sample.level,
          duration: sample.duration,
          totalSessions: sample.sessions.length,
        })
        .returning({ id: trainingPrograms.id });

      if (!program) {
        throw new Error(`Insert returned no row for "${sample.title}"`);
      }

      const sessionRows = sample.sessions.map((s) => ({
        programId: program.id,
        workoutId: null,
        title: s.title,
        description: s.description,
        dayNumber: s.dayNumber,
        orderInDay: 1,
        isRestDay: s.isRestDay,
      }));

      await tx.insert(programSessions).values(sessionRows);

      console.log(
        `Inserted "${sample.title}" (id=${program.id}, ${sessionRows.length} sessions)`,
      );
      inserted += 1;
      totalSessionsInserted += sessionRows.length;
    }
  });

  console.log(
    `Inserted ${inserted} programs, ${totalSessionsInserted} sessions. Skipped ${skipped}. Coach: ${coachEmail}`,
  );
}

main()
  .then(async () => {
    await pool.end();
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
