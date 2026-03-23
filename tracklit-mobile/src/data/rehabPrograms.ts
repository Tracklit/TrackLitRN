export interface RehabExercise {
  name: string;
  sets: string;
  duration: string;
  description: string;
}

export interface RehabPhase {
  name: string;
  days: string;
  goals: string[];
  exercises: RehabExercise[];
}

export interface RehabProgram {
  title: string;
  categoryLabel: string;
  duration: string;
  phases: RehabPhase[];
}

export const REHAB_PROGRAMS: Record<string, RehabProgram> = {

  'acute-quad': {
    title: 'Acute Quadriceps Strain Recovery',
    categoryLabel: 'Acute Muscle',
    duration: '3-6 weeks',
    phases: [
      {
        name: 'Phase 1: Protection & Pain Control',
        days: 'Days 1–5',
        goals: ['Reduce swelling and bruising', 'Protect the healing muscle', 'Maintain hip and knee mobility'],
        exercises: [
          { name: 'RICE Protocol', sets: 'Every 2-3 hours', duration: 'First 48 hours', description: 'Rest, Ice 15-20 min, Compression wrap from mid-thigh to knee, Elevate leg above heart level' },
          { name: 'Passive Knee Flexion', sets: '4-5 times daily', duration: '5-10 slow reps', description: 'Lying prone, gently bend knee using a towel or strap to assist. Stop at first sign of pain. Keep below 90°' },
          { name: 'Isometric Quad Set', sets: '3-4 times daily', duration: '10 x 5-second holds', description: 'Lying on back, press knee firmly into bed or floor, tighten quadriceps without moving the leg' },
          { name: 'Heel Slides', sets: '3 times daily', duration: '15 reps each session', description: 'Lying on back, slowly slide heel toward buttocks. Stop before discomfort. Improve range daily' },
        ],
      },
      {
        name: 'Phase 2: Controlled Strengthening',
        days: 'Days 5–21',
        goals: ['Restore full range of motion', 'Begin progressive loading', 'Reduce pain during activity'],
        exercises: [
          { name: 'Terminal Knee Extension', sets: '3 sets', duration: '15 reps', description: 'Using a resistance band around the knee, straighten the leg from 30° of flexion. Controlled tempo' },
          { name: 'Mini Squats (0–45°)', sets: '3 sets', duration: '12-15 reps', description: 'Bodyweight squat to no more than 45° of knee flexion. Progress depth as tolerated. Use wall support if needed' },
          { name: 'Step-Ups', sets: '3 sets', duration: '10 reps each leg', description: 'Step onto a low platform (15-20cm). Control the descent. Increase height as strength improves' },
          { name: 'Stationary Bike', sets: '1 session daily', duration: '15-20 minutes', description: 'Low resistance, high seat position. Smooth pedaling motion, no pain. Gradually lower seat' },
          { name: 'Prone Knee Curls', sets: '3 sets', duration: '12-15 reps', description: 'Lying face down, slowly bend knee against light resistance. Keep hips flat on the surface' },
        ],
      },
      {
        name: 'Phase 3: Functional & Return to Sport',
        days: 'Weeks 3–6',
        goals: ['Restore full strength and flexibility', 'Rebuild sport-specific movement patterns', 'Prevent re-injury'],
        exercises: [
          { name: 'Full Depth Squats', sets: '4 sets', duration: '12 reps', description: 'Progress to full depth squat when pain-free. Add load gradually. Focus on equal weight distribution' },
          { name: 'Leg Press', sets: '4 sets', duration: '12-15 reps', description: 'Full range leg press at controlled tempo. Start moderate weight, progress weekly' },
          { name: 'Nordic Hamstring Curls', sets: '3 sets', duration: '8 reps', description: 'Kneel with feet secured. Slowly lower body using hamstrings. Improves knee flexor balance with quads' },
          { name: 'Straight-Line Running Progression', sets: 'Gradual', duration: 'Start 50% speed', description: 'Light jog → stride → tempo run → sprint. Only progress if pain-free at each stage' },
          { name: 'Change of Direction Drills', sets: '2-3 sets', duration: '10 minutes', description: 'Cone drills, lateral shuffles, figure-8 patterns. Return to sport-specific movements' },
        ],
      },
    ],
  },

  'acute-calf': {
    title: 'Acute Calf Strain Recovery',
    categoryLabel: 'Acute Muscle',
    duration: '2-6 weeks',
    phases: [
      {
        name: 'Phase 1: Immediate Care',
        days: 'Days 1–4',
        goals: ['Control swelling and pain', 'Protect the healing gastrocnemius/soleus', 'Maintain ankle mobility'],
        exercises: [
          { name: 'RICE Protocol', sets: 'Continuous first 24-48 hours', duration: 'Ice 15 min every 2-3 hrs', description: 'Rest completely, apply ice, compression stocking from foot to knee, elevate leg when seated or lying' },
          { name: 'Ankle Alphabet', sets: '4 times daily', duration: '2 rounds A-Z', description: 'Seated, trace each letter of the alphabet with your foot. Keeps ankle mobile without loading calf' },
          { name: 'Seated Calf Raises (partial)', sets: '3 times daily', duration: '10 gentle reps', description: 'Seated position only. Gently rise onto toes from a seated position. Stop if painful. Progress slowly' },
          { name: 'Towel Calf Stretch', sets: '3 times daily', duration: '20-second holds', description: 'Seated, wrap towel around foot and gently pull toes toward you. No bouncing, hold at comfortable stretch' },
        ],
      },
      {
        name: 'Phase 2: Progressive Loading',
        days: 'Days 4–21',
        goals: ['Regain full ankle range of motion', 'Restore single-leg strength', 'Begin walking without limp'],
        exercises: [
          { name: 'Standing Calf Raises (bilateral)', sets: '3 sets', duration: '15 reps', description: 'Rise onto toes holding a support. Progress to bodyweight then loaded. Slow 3-second descent' },
          { name: 'Single-Leg Calf Raise', sets: '3 sets', duration: '10-12 reps', description: 'Progress from bilateral when pain-free. Use wall for balance. Slow controlled movement is essential' },
          { name: 'Heel-Toe Walks', sets: '2-3 times daily', duration: '20 metres each', description: 'Walk 20m on heels, then 20m on toes. Builds dorsiflexion and plantar flexion strength' },
          { name: 'Resistance Band Plantar Flexion', sets: '3 sets', duration: '15 reps', description: 'Seated with band around forefoot, push foot down against resistance. Isolates calf without impact' },
          { name: 'Stationary Cycling', sets: '1 session daily', duration: '15-20 minutes', description: 'Low to moderate resistance, smooth pedaling. Maintains cardiovascular fitness while loading calf gently' },
        ],
      },
      {
        name: 'Phase 3: Sport Return',
        days: 'Weeks 3–6',
        goals: ['Achieve full single-leg strength', 'Return to running and jumping', 'Prevent recurrence'],
        exercises: [
          { name: 'Loaded Calf Raises', sets: '4 sets', duration: '12 reps', description: 'Hold dumbbells or use calf raise machine. Progress to full bodyweight + load. Include bent-knee variation for soleus' },
          { name: 'Jump Rope', sets: '3 sets', duration: '30-60 seconds', description: 'Begin with two-foot jumps at low intensity. Progress to single-leg jumps as pain allows' },
          { name: 'Box Jumps (low)', sets: '3 sets', duration: '8 reps', description: 'Jump onto and off a low box (20-30cm). Land softly with knees bent. Builds reactive calf strength' },
          { name: 'Running Progression', sets: 'Gradual', duration: 'Walk-jog intervals', description: 'Walk 1 min, jog 1 min. Progress ratio weekly. Achieve 20 continuous pain-free minutes before sprinting' },
          { name: 'Plyometric Progressions', sets: '3 sets', duration: '10 reps', description: 'Skipping, bounding, hopping drills. Progress from low impact to higher intensity over 2-3 weeks' },
        ],
      },
    ],
  },

  'acute-groin': {
    title: 'Acute Groin Strain Recovery',
    categoryLabel: 'Acute Muscle',
    duration: '2-8 weeks',
    phases: [
      {
        name: 'Phase 1: Pain Management',
        days: 'Days 1–5',
        goals: ['Reduce acute pain and inflammation', 'Protect adductor muscles', 'Maintain hip joint mobility'],
        exercises: [
          { name: 'Rest & Compression', sets: 'Continuous', duration: 'First 48 hours', description: 'Avoid all hip abduction movements. Apply ice for 15-20 min every 2-3 hours. Use compression shorts for support' },
          { name: 'Supine Hip Flexion', sets: '3 times daily', duration: '10 reps', description: 'Lying on back, slowly bring knee to chest, keeping leg in neutral position. No outward rotation of the hip' },
          { name: 'Isometric Adductor Squeeze', sets: '3 times daily', duration: '10 x 5-second holds', description: 'Lying on back with knees bent, place a ball or pillow between knees. Gently squeeze without pain. Build gradually' },
          { name: 'Gentle Hip Circles', sets: '2 times daily', duration: '10 circles each direction', description: 'Seated, small controlled hip circles. Keeps hip mobile without stressing the adductors' },
        ],
      },
      {
        name: 'Phase 2: Strengthening',
        days: 'Days 5–21',
        goals: ['Restore adductor strength', 'Improve hip stability', 'Return to pain-free walking'],
        exercises: [
          { name: 'Side-Lying Hip Adduction', sets: '3 sets', duration: '12-15 reps', description: 'Lying on side, top leg on pillow. Lift bottom leg toward ceiling. Add ankle weight when comfortable' },
          { name: 'Sumo Squats', sets: '3 sets', duration: '12 reps', description: 'Wide stance squat with toes pointed out 45°. Engages adductors in a loaded, functional position. Use bodyweight first' },
          { name: 'Adductor Ball Squeezes (standing)', sets: '3 sets', duration: '15 reps', description: 'Standing, place ball between knees and squeeze while performing a mini squat. Integrates strengthening with movement' },
          { name: 'Copenhagen Plank (modified)', sets: '3 sets', duration: '10-second holds', description: 'Side plank with top knee on a chair. Hold position. Highly effective adductor exercise for athletes' },
          { name: 'Lateral Band Walks', sets: '3 sets', duration: '15 steps each direction', description: 'Resistance band around ankles, maintain squat position, step laterally. Builds hip abductor balance with adductors' },
        ],
      },
      {
        name: 'Phase 3: Functional Return',
        days: 'Weeks 3–8',
        goals: ['Full adductor strength bilateral symmetry', 'Dynamic sport movements', 'Prevent recurrence'],
        exercises: [
          { name: 'Copenhagen Plank (full)', sets: '3 sets', duration: '20-30 second holds', description: 'Full side plank with foot elevated on a bench or chair. The gold standard for groin injury prevention' },
          { name: 'Single-Leg Squat', sets: '3 sets', duration: '10 reps each leg', description: 'Controlled single-leg squat. Focus on knee tracking over toes. Add load when technique is solid' },
          { name: 'Lateral Bounding', sets: '3 sets', duration: '10 bounds each direction', description: 'Bound laterally from foot to foot with controlled landing. Reintroduces lateral force through the groin' },
          { name: 'Agility Ladder Drills', sets: '4 sets', duration: '15 metres', description: 'Lateral shuffles, in-out patterns, T-drills. Progressively increase speed over 2-3 sessions' },
          { name: 'Change of Direction Sprints', sets: '4-6 reps', duration: 'Full speed', description: '45° and 90° change of direction sprints on field. Only progress once all straight-line running is pain-free' },
        ],
      },
    ],
  },

  'chronic-hamstring': {
    title: 'Chronic Hamstring Tendinopathy Recovery',
    categoryLabel: 'Chronic Injury',
    duration: '8-16 weeks',
    phases: [
      {
        name: 'Phase 1: Load Management',
        days: 'Weeks 1–3',
        goals: ['Reduce tendon irritation', 'Establish pain-free baseline load', 'Educate on activity modification'],
        exercises: [
          { name: 'Isometric Hamstring Holds', sets: '4 sets daily', duration: '45-second holds at 70% effort', description: 'Leg curl machine or prone leg curl against resistance. Isometrics reduce tendon pain acutely — do not avoid activity entirely' },
          { name: 'Hip Hinge (bodyweight)', sets: '3 sets', duration: '15 reps', description: 'Romanian deadlift motion with no load. Hinge at hips, slight knee bend, feel hamstring stretch. Controlled throughout' },
          { name: 'Seated Hamstring Stretching', sets: '3 times daily', duration: '30-second holds', description: 'Seated stretch — avoid stretching into pain. Chronic tendinopathy responds better to loading than stretching' },
          { name: 'Aqua Running or Swimming', sets: '3-4 sessions/week', duration: '20-30 minutes', description: 'Maintain cardiovascular fitness without high compressive load on the tendon. Deep-water running is ideal' },
        ],
      },
      {
        name: 'Phase 2: Progressive Tendon Loading',
        days: 'Weeks 3–10',
        goals: ['Build tendon capacity through progressive overload', 'Improve pain tolerance', 'Restore strength symmetry'],
        exercises: [
          { name: 'Romanian Deadlift (loaded)', sets: '3 sets', duration: '8-10 reps', description: 'Progress load weekly. Heavy, slow resistance training is the most evidence-based treatment for tendinopathy' },
          { name: 'Nordic Hamstring Curls', sets: '3 sets', duration: '5-8 reps', description: 'Kneel with feet secured. Lower slowly for 4 seconds. The most effective eccentric exercise for hamstring injury prevention and recovery' },
          { name: 'Single-Leg Deadlift', sets: '3 sets', duration: '10 reps each leg', description: 'Hinge on one leg, extending the other behind. Demands control and loads the proximal hamstring effectively' },
          { name: 'Leg Curl Machine', sets: '4 sets', duration: '8-12 reps', description: 'Both prone and seated variation. Seated leg curl applies more load to proximal tendon — build up gradually' },
          { name: 'Stationary Cycling', sets: '4-5 sessions/week', duration: '30 minutes', description: 'Moderate resistance. Monitor symptom response 24 hours after each session. Adjust load accordingly' },
        ],
      },
      {
        name: 'Phase 3: High-Speed Return',
        days: 'Weeks 10–16',
        goals: ['Achieve high-speed loading tolerance', 'Return to full sprint capacity', 'Long-term injury prevention strategy'],
        exercises: [
          { name: 'Sprint Mechanics Drills', sets: '4 sets', duration: '30-40m', description: 'A-skips, B-skips, high-knee drills. Optimize running technique to reduce tendon stress at high speeds' },
          { name: 'Sled Push/Pull', sets: '4 sets', duration: '20m', description: 'Heavy resistance sled push followed by light resistance pull. Develops hamstring strength through full sprinting range' },
          { name: 'Tempo Runs', sets: '6-8 reps', duration: '100-150m at 75-85%', description: 'Structured tempo running with full recovery between reps. Build to full sprint speed over 3-4 weeks' },
          { name: 'Plyometric Progressions', sets: '3 sets', duration: '8-10 reps', description: 'Hurdle hops, bounds, reactive jumps. Introduces rapid stretch-shortening cycle demands on the hamstring' },
          { name: 'Full Sprint with Monitoring', sets: '4-6 reps', duration: 'Maximum speed 50m', description: 'Return to maximum velocity running. Monitor pain levels (0-2/10 acceptable during, 0/10 within 24 hours)' },
        ],
      },
    ],
  },

  'chronic-quad': {
    title: 'Patellar Tendinopathy (Jumper\'s Knee) Recovery',
    categoryLabel: 'Chronic Injury',
    duration: '8-16 weeks',
    phases: [
      {
        name: 'Phase 1: Pain Control & Isometric Loading',
        days: 'Weeks 1–3',
        goals: ['Reduce patellar tendon pain', 'Maintain quad strength with isometrics', 'Modify provocative activities'],
        exercises: [
          { name: 'Spanish Squat Isometric', sets: '4 sets daily', duration: '45-second holds', description: 'Back against wall, feet away from wall, knees at 60° — a Spanish squat position. Reduces patellar tendon pain immediately. Key exercise' },
          { name: 'Leg Press (isometric hold)', sets: '4 sets', duration: '45 seconds at 70° knee flexion', description: 'Leg press machine, hold position statically. Alternative to Spanish squat for tendon pain relief' },
          { name: 'Quad Stretch', sets: '3 times daily', duration: '30-second holds', description: 'Standing quad stretch — hold ankle behind. Gentle, do not stretch into pain. Avoid deep stretching' },
          { name: 'Ice After Activity', sets: 'Post-exercise', duration: '15 minutes', description: 'Apply ice for 15 minutes after any exercise to manage inflammation. Part of load monitoring strategy' },
        ],
      },
      {
        name: 'Phase 2: Heavy Slow Resistance Training',
        days: 'Weeks 3–10',
        goals: ['Build tendon capacity', 'Reduce pain during loading', 'Improve quad strength and control'],
        exercises: [
          { name: 'Slow Leg Press (4-second tempo)', sets: '4 sets', duration: '8 reps', description: 'Full range leg press with 4 seconds down, 4 seconds up. Heavy slow resistance is the gold standard for patellar tendinopathy' },
          { name: 'Decline Board Squat', sets: '3 sets', duration: '10-12 reps', description: 'Squat on a 25-30° decline board with weight vest. Isolates patellar tendon loading. Very effective for chronic cases' },
          { name: 'Leg Extension (slow)', sets: '3 sets', duration: '10 reps at 3-second tempo', description: 'Controlled leg extension. Controversial but effective in slow loading. Avoid if highly irritable' },
          { name: 'Bulgarian Split Squat', sets: '3 sets', duration: '10 reps each leg', description: 'Rear foot elevated split squat. High quad demand with good control. Progress load weekly' },
          { name: 'Cycling / Swimming', sets: '4 sessions/week', duration: '30 minutes', description: 'Cross-training to maintain fitness. Cycling preferred as it loads quad in controlled range' },
        ],
      },
      {
        name: 'Phase 3: Sport-Specific Conditioning',
        days: 'Weeks 10–16',
        goals: ['Return to jumping and running', 'Full sport participation', 'Long-term tendon health management'],
        exercises: [
          { name: 'Plyometric Jump Progression', sets: '3 sets', duration: '10 reps', description: 'Counter-movement jumps → drop jumps → single-leg jumps. Only progress when pain ≤ 2/10 during and 0/10 24 hours after' },
          { name: 'Bounding & Hopping Drills', sets: '4 sets', duration: '20m', description: 'Progressive hopping drills on both legs and single leg. Builds reactive strength in the tendon' },
          { name: 'Sport Return Protocol', sets: 'Gradual', duration: 'Over 4 weeks', description: 'Return to sport-specific training: 25% → 50% → 75% → 100% of full training load. Monitor weekly' },
          { name: 'Maintenance Strength Program', sets: '2 sessions/week', duration: 'Ongoing', description: 'Continue 2x/week heavy slow resistance training even after return to sport. Prevents recurrence' },
        ],
      },
    ],
  },

  'chronic-calf': {
    title: 'Achilles Tendinopathy Recovery',
    categoryLabel: 'Chronic Injury',
    duration: '10-16 weeks',
    phases: [
      {
        name: 'Phase 1: Isometric Loading & Pain Control',
        days: 'Weeks 1–3',
        goals: ['Reduce tendon pain', 'Maintain Achilles loading capacity', 'Avoid complete rest'],
        exercises: [
          { name: 'Isometric Calf Hold (wall)', sets: '4 sets daily', duration: '45-second holds', description: 'Stand on tiptoes and hold the position isometrically against a wall. Reduces tendon pain within 45 minutes. Use pre-sport' },
          { name: 'Heel Drop Stretch (gentle)', sets: '2 times daily', duration: '20-second holds', description: 'Seated towel stretch only — avoid aggressive calf stretching with Achilles tendinopathy as it compresses the tendon' },
          { name: 'Foot Strengthening', sets: '3 sets', duration: '20 reps', description: 'Toe curls, short foot exercises, marble pickup. Strengthens intrinsic foot muscles that reduce Achilles load' },
          { name: 'Low-Impact Cardio', sets: '4 sessions/week', duration: '20-30 minutes', description: 'Cycling or swimming. Avoid running entirely in Phase 1. Cross-training maintains fitness and reduces tendon load' },
        ],
      },
      {
        name: 'Phase 2: Eccentric & Heavy Slow Loading',
        days: 'Weeks 3–10',
        goals: ['Rebuild tendon strength and structure', 'Reduce morning stiffness', 'Pain-free walking and low-impact activity'],
        exercises: [
          { name: 'Alfredson Protocol (Eccentric Heel Drop)', sets: '3 sets morning, 3 sets evening', duration: '15 reps each (daily)', description: 'Stand on edge of step, rise on both feet, lower slowly on single foot. The Alfredson protocol: 180 reps/day. Continue even with mild pain. Proven most effective treatment for mid-portion Achilles tendinopathy' },
          { name: 'Seated Calf Raise (slow)', sets: '3 sets', duration: '12 reps at 3-second tempo', description: 'Targets soleus specifically. Bend knee at 90°, slowly raise heel. The soleus is critical for running load absorption' },
          { name: 'Romanian Deadlift', sets: '3 sets', duration: '10 reps', description: 'Loads the calf eccentrically during hip hinge. Progressive loading improves overall posterior chain capacity' },
          { name: 'Aqua Running', sets: '3 sessions/week', duration: '20-25 minutes', description: 'Deep water running maintains running mechanics and cardiovascular fitness without tendon compression' },
        ],
      },
      {
        name: 'Phase 3: Running Return & Sport Conditioning',
        days: 'Weeks 10–16',
        goals: ['Return to full running loads', 'Sport-specific explosive movements', 'Maintenance program for tendon health'],
        exercises: [
          { name: 'Run-Walk Progression', sets: '3 sessions/week', duration: 'Progressive', description: '2 min walk, 1 min jog → 1 min walk, 2 min jog → continuous jogging. Increase no more than 10% per week' },
          { name: 'Loaded Plyometrics', sets: '3 sets', duration: '10 reps', description: 'Weighted calf jumps, pogo jumps, single-leg hops. Introduces high-speed spring energy into the tendon' },
          { name: 'Sprint Intervals', sets: '4-6 reps', duration: '50-100m', description: 'Gradually introduce high-speed running. Achilles load peaks during maximal sprinting — progress carefully' },
          { name: 'Ongoing Maintenance Strength', sets: '2 sessions/week', duration: 'Indefinitely', description: 'Continue eccentric heel drops and calf strengthening permanently. This prevents recurrence, which is very common' },
        ],
      },
    ],
  },

  'chronic-groin': {
    title: 'Chronic Groin Pain & Athletic Pubalgia Recovery',
    categoryLabel: 'Chronic Injury',
    duration: '8-14 weeks',
    phases: [
      {
        name: 'Phase 1: Load Reduction & Foundation',
        days: 'Weeks 1–3',
        goals: ['Reduce groin region pain', 'Build core and hip stability', 'Identify and modify provocative activities'],
        exercises: [
          { name: 'Supine Core Activation', sets: '3 times daily', duration: '10 reps', description: 'Abdominal bracing and transverse abdominis activation. Reduce compensatory tension in adductors caused by poor core control' },
          { name: 'Isometric Adductor Squeeze', sets: '3 sets daily', duration: '10 x 10-second holds', description: 'Lying, place ball between knees and squeeze at progressively higher intensities. Builds adductor capacity pain-free' },
          { name: 'Hip Flexor Stretch', sets: '3 times daily', duration: '30-second holds', description: 'Kneeling hip flexor stretch. Tight hip flexors increase groin loading — important to address' },
          { name: 'Side-Lying Hip Abduction', sets: '3 sets', duration: '15 reps', description: 'Lift top leg against gravity. Strengthens gluteus medius, which reduces demand on the adductor complex' },
        ],
      },
      {
        name: 'Phase 2: Progressive Strength',
        days: 'Weeks 3–10',
        goals: ['Build bilateral adductor strength', 'Restore pain-free hip loading', 'Improve athletic movement patterns'],
        exercises: [
          { name: 'Copenhagen Adductor Exercise', sets: '3 sets', duration: '8-12 reps per leg', description: 'Side-lying, top foot on bench, lift bottom leg to meet it. The most effective evidence-based exercise for chronic groin injury' },
          { name: 'Sumo Deadlift', sets: '3 sets', duration: '8-10 reps', description: 'Wide-stance deadlift. Demands hip external rotation and adductor co-activation. Build load progressively' },
          { name: 'Long Adductor Stretch (with loading)', sets: '3 sets', duration: '45-second holds', description: 'Seated straddle position. Gentle lean to each side. Loaded stretching improves chronic adductor flexibility' },
          { name: 'Single-Leg Squat with Cross-Body Reach', sets: '3 sets', duration: '10 reps', description: 'Squat on one leg while reaching arms across body. High demand on hip stabilizers and adductors' },
          { name: 'Resistance Band Lateral Walks', sets: '3 sets', duration: '20 steps each direction', description: 'Band around ankles in squat stance. Targets hip abductors which reciprocally load adductors' },
        ],
      },
      {
        name: 'Phase 3: Athletic Return',
        days: 'Weeks 10–14',
        goals: ['Full sport-specific function', 'High-speed change of direction', 'Injury prevention maintenance'],
        exercises: [
          { name: 'Lateral Sprint & Cut Drills', sets: '5-6 reps', duration: 'Full speed', description: 'T-drill and lateral shuttle run at full speed. Reintroduces maximal lateral forces through the groin' },
          { name: 'Kicking Mechanics Training', sets: '10-15 kicks', duration: 'Both legs', description: 'For soccer/football athletes. Gradual return to kicking with correct mechanics and progressive force' },
          { name: 'Weighted Copenhagen Plank', sets: '3 sets', duration: '20-second holds', description: 'Add ankle weight to Copenhagen side plank. Maintenance-level adductor loading for permanent program' },
          { name: 'Full Training Participation', sets: 'Progressive', duration: '25% → 100% over 4 weeks', description: 'Return to full training load gradually. Continue adductor maintenance exercises 2x/week permanently' },
        ],
      },
    ],
  },

  'chronic-other-tendons': {
    title: 'General Tendinopathy Recovery Protocol',
    categoryLabel: 'Chronic Injury',
    duration: '8-14 weeks',
    phases: [
      {
        name: 'Phase 1: Pain Control & Isometric Loading',
        days: 'Weeks 1–3',
        goals: ['Identify the specific tendon and provocative load', 'Reduce pain using isometrics', 'Avoid complete inactivity'],
        exercises: [
          { name: 'Tendon-Specific Isometrics', sets: '4 sets daily', duration: '45-second holds', description: 'Identify the affected tendon (rotator cuff, peroneal, tibialis, etc.) and perform isometric contraction at mid-range. Reduces pain within 45 minutes' },
          { name: 'Joint Mobility Work', sets: '2 times daily', duration: '10 minutes', description: 'Maintain full range of motion in surrounding joints. Stiffer joints increase tendon demand. Avoid stretching the tendon itself aggressively' },
          { name: 'Cross-Training', sets: '4 sessions/week', duration: '20-30 minutes', description: 'Choose activity that does not load the affected tendon. Pool running, cycling, or upper/lower body alternatives' },
          { name: 'Symptom Monitoring', sets: 'Daily', duration: 'Track pain 0-10', description: 'Rate pain during activity, immediately after, and 24 hours after. Acceptable: up to 4/10 during exercise, 0/10 the following morning' },
        ],
      },
      {
        name: 'Phase 2: Heavy Slow Resistance Training',
        days: 'Weeks 3–10',
        goals: ['Stimulate tendon collagen remodeling', 'Build load tolerance', 'Reduce chronic pain cycle'],
        exercises: [
          { name: 'Heavy Resistance (3-second tempo)', sets: '3-4 sets', duration: '8-10 reps', description: 'Identify the best exercise to load the tendon through range (e.g., shoulder press for rotator cuff, calf raise for Achilles). Slow, heavy loading is the most evidence-based treatment' },
          { name: 'Eccentric Phase Emphasis', sets: '3 sets', duration: '10-12 reps (3-4 sec lowering)', description: 'Emphasize the eccentric (lowering) phase. This phase produces the most collagen synthesis stimulus in tendons' },
          { name: 'Supporting Muscle Strengthening', sets: '3 sets', duration: '12-15 reps', description: 'Strengthen muscles surrounding the tendon to share load and reduce tendon stress (e.g., rotator cuff for shoulder tendon issues)' },
          { name: 'Aquatic Exercise', sets: '3 sessions/week', duration: '25 minutes', description: 'Maintain cardiovascular base and muscle strength without excessive tendon loading. Reduces overall recovery time' },
        ],
      },
      {
        name: 'Phase 3: Return to High-Speed Loading',
        days: 'Weeks 10–14',
        goals: ['Full sport participation', 'Reactive and explosive load tolerance', 'Permanent maintenance strategy'],
        exercises: [
          { name: 'Energy-Storage Exercises', sets: '3 sets', duration: '8-10 reps', description: 'Sport-specific plyometric exercises that require the tendon to store and release energy (e.g., jumps for patellar, bounding for Achilles)' },
          { name: 'Sport-Specific Drills', sets: '4-6 sets', duration: 'Progressive intensity', description: 'Introduce full sport movements at 50% → 75% → 100% intensity over 3-4 weeks. Monitor symptom response' },
          { name: 'Maintenance Strength Program', sets: '2 sessions/week', duration: 'Indefinitely', description: 'Continue resistance training 2x/week even after return. Tendinopathy recurrence risk is high without ongoing loading' },
        ],
      },
    ],
  },

  'back-disc': {
    title: 'Lumbar Disc Recovery Program',
    categoryLabel: 'Back Injury',
    duration: '6-14 weeks',
    phases: [
      {
        name: 'Phase 1: Acute Management & Pain Control',
        days: 'Weeks 1–2',
        goals: ['Reduce nerve irritation and pain', 'Find positions of relief', 'Maintain basic mobility'],
        exercises: [
          { name: 'McKenzie Extension Exercises', sets: '8-10 reps hourly', duration: '30 seconds each', description: 'Lying face-down, prop up on elbows (sphinx position), then progress to press-ups. Most effective for disc herniations with posterior disc bulge' },
          { name: 'Lumbar Extension Progression', sets: '4 times daily', duration: '10 reps', description: 'Prone lying → prone on elbows → press-up. Move only as far as comfortable. Centralisation of pain (pain moving from leg to back) is a positive sign' },
          { name: 'Nerve Flossing (gentle)', sets: '2 times daily', duration: '10 slow reps', description: 'Seated, alternately flex and extend knee with foot. Gently mobilizes the sciatic nerve without aggravating the disc' },
          { name: 'Walking', sets: '2-3 times daily', duration: '10-20 minutes', description: 'Gentle walking is one of the best early treatments for disc injury. Avoid sitting for long periods — use a rolled towel for lumbar support' },
        ],
      },
      {
        name: 'Phase 2: Core Stabilization',
        days: 'Weeks 2–8',
        goals: ['Build spinal stability without compression', 'Restore movement patterns', 'Reduce recurrence risk'],
        exercises: [
          { name: 'McGill Big Three: Cat-Cow', sets: '3 times daily', duration: '10 slow reps', description: 'Alternate between lumbar flexion (cat) and extension (cow) on hands and knees. Restores segmental mobility. Do within pain-free range only' },
          { name: 'McGill Big Three: Bird-Dog', sets: '3 sets', duration: '5 x 10-second holds each side', description: 'From hands and knees, extend opposite arm and leg simultaneously. The single best exercise for lumbar stability without spinal compression' },
          { name: 'McGill Big Three: Side Bridge', sets: '3 sets', duration: '3 x 10-second holds each side', description: 'Side plank from knees or feet. Builds lateral core stability without flexion or excessive compression' },
          { name: 'Dead Bug', sets: '3 sets', duration: '8 reps each side', description: 'Lying on back with arms up and legs at 90°, lower opposite arm/leg toward the floor while maintaining neutral spine. No breath-holding' },
          { name: 'Hip Hinge Technique', sets: '3 sets', duration: '15 reps', description: 'Relearn safe hinge pattern without lumbar flexion. Critical for athletes who lift, throw, or run' },
        ],
      },
      {
        name: 'Phase 3: Functional Strength & Return',
        days: 'Weeks 8–14',
        goals: ['Return to lifting, running and sport', 'Full load tolerance', 'Long-term disc health strategies'],
        exercises: [
          { name: 'Romanian Deadlift (progressive)', sets: '3 sets', duration: '10 reps', description: 'Build to loaded hip hinge with excellent mechanics. The safest way to return to deadlifting after disc injury' },
          { name: 'Goblet Squat', sets: '3 sets', duration: '12 reps', description: 'Counterbalanced squat with weight in front. Natural upright torso reduces disc pressure compared to barbell back squat' },
          { name: 'Farmer Carry', sets: '3 sets', duration: '30 metres', description: 'Carry heavy weights bilaterally while walking. Excellent spinal loading exercise that builds tolerance for sport-specific carrying and trunk stability' },
          { name: 'Running Progression', sets: 'Gradual', duration: 'Walk → jog → run over 4 weeks', description: 'Start with walking, progress to jogging when pain-free. Running is generally safe for lumbar discs once acute phase resolves' },
          { name: 'Sport-Specific Conditioning', sets: 'Progressive', duration: '4-week return protocol', description: 'Return to sport at 25% → 50% → 75% → 100% intensity. Avoid high-speed trunk rotation sports until 12+ weeks post-injury' },
        ],
      },
    ],
  },

  'back-ligament': {
    title: 'Lumbar Ligament & Joint Sprain Recovery',
    categoryLabel: 'Back Injury',
    duration: '4-10 weeks',
    phases: [
      {
        name: 'Phase 1: Acute Protection',
        days: 'Weeks 1–2',
        goals: ['Manage acute pain and inflammation', 'Maintain movement without aggravation', 'Restore neutral posture'],
        exercises: [
          { name: 'Supported Resting Position', sets: 'As needed', duration: 'Until pain reduces', description: 'Lie on back with knees supported at 90° on a chair or pillow. The 90/90 position unloads the lumbar spine and relieves ligament stress' },
          { name: 'Pelvic Tilts', sets: '3 times daily', duration: '10-15 reps', description: 'Gently rock pelvis forward and back while lying. Restores lumbar movement and reduces muscle guarding without loading injured ligaments' },
          { name: 'Knee-to-Chest Stretch', sets: '3 times daily', duration: '20-second holds each side', description: 'Lying, bring one knee to chest gently. Relieves facet joint compression and stretched ligament tension' },
          { name: 'Short Walks', sets: '4-6 times daily', duration: '5-10 minutes', description: 'Frequent short walks are better than one long walk. Promotes blood flow to injured ligaments and prevents stiffness' },
        ],
      },
      {
        name: 'Phase 2: Stabilization & Strength',
        days: 'Weeks 2–6',
        goals: ['Build muscular support for injured ligaments', 'Restore full range of motion', 'Return to daily activities'],
        exercises: [
          { name: 'Bird-Dog', sets: '3 sets', duration: '8 x 10-second holds each side', description: 'Spinal stabilization exercise that builds the deep multifidus muscles, which provide local segmental support to injured ligaments' },
          { name: 'Glute Bridge', sets: '3 sets', duration: '15 reps', description: 'Lying on back with knees bent, lift hips. Builds glutes and hamstrings which support the lumbar spine. Progress to single-leg bridge' },
          { name: 'Plank (from knees)', sets: '3 sets', duration: '20-30 second holds', description: 'Build to full plank from feet over 2-3 weeks. Strong anterior core provides ligament unloading during movement' },
          { name: 'Hip Flexor Stretch', sets: '3 times daily', duration: '30-second holds', description: 'Kneeling hip flexor stretch. Tight hip flexors pull the lumbar spine into excessive extension, straining posterior ligaments' },
          { name: 'Walking Program', sets: 'Daily', duration: 'Build to 30 continuous minutes', description: 'Increase walking duration by 5 minutes each week. Full recovery for simple ligament sprains expected by 6-8 weeks' },
        ],
      },
      {
        name: 'Phase 3: Functional & Sport Return',
        days: 'Weeks 6–10',
        goals: ['Full sport-specific function', 'Heavy lifting tolerance', 'Injury prevention posture habits'],
        exercises: [
          { name: 'Deadlift Progression', sets: '3 sets', duration: '8-10 reps', description: 'Begin with trap bar or Romanian deadlift, progressing to conventional. Teaches safe lifting mechanics to protect healing ligaments' },
          { name: 'Medicine Ball Rotations', sets: '3 sets', duration: '10 reps each direction', description: 'Controlled rotational exercises. Reintroduce trunk rotation safely, building to sport-specific movement demands' },
          { name: 'Conditioning Drills', sets: '3-4 sessions/week', duration: '20-30 minutes', description: 'Running, cycling, or sport-specific conditioning. Full impact sports typically cleared at 8-10 weeks with good strength symmetry' },
        ],
      },
    ],
  },

  'back-other': {
    title: 'General Back Pain Recovery Protocol',
    categoryLabel: 'Back Injury',
    duration: '4-10 weeks',
    phases: [
      {
        name: 'Phase 1: Active Recovery',
        days: 'Weeks 1–2',
        goals: ['Maintain activity within pain limits', 'Reduce muscle spasm', 'Restore normal movement'],
        exercises: [
          { name: 'Walking Program', sets: 'Multiple times daily', duration: '10-20 minutes', description: 'Gentle walking is the best early intervention for back pain. Avoid bed rest — it delays recovery' },
          { name: 'Cat-Cow Mobility', sets: '3 times daily', duration: '10 slow reps', description: 'Hands and knees, alternate between flexion and extension of the spine. Reduces muscle guarding and restores movement' },
          { name: 'Supine Knee Rotations', sets: '2 times daily', duration: '10 reps each side', description: 'Lying with knees bent, gently rock both knees side to side. Mobilizes thoracolumbar fascia and reduces stiffness' },
          { name: 'Seated Hip Circles', sets: '2 times daily', duration: '10 circles each direction', description: 'Seated on chair or floor, perform gentle hip circles. Maintains hip mobility which directly impacts lower back' },
        ],
      },
      {
        name: 'Phase 2: Core & Hip Strengthening',
        days: 'Weeks 2–6',
        goals: ['Build a strong foundation to support the spine', 'Correct movement dysfunctions', 'Reduce pain recurrence'],
        exercises: [
          { name: 'Dead Bug', sets: '3 sets', duration: '8 reps each side', description: 'Lying on back, coordinate limb movements while maintaining neutral lumbar spine. Fundamental core motor control exercise' },
          { name: 'Bird-Dog', sets: '3 sets', duration: '8 x 10-second holds each side', description: 'Best exercise for developing the multifidus muscle, which provides critical segmental lumbar stability' },
          { name: 'Hip Hinge Pattern', sets: '3 sets', duration: '15 reps', description: 'Learn to flex at the hips with a neutral spine rather than bending through the lower back. Foundation of all safe lifting' },
          { name: 'Glute Bridges', sets: '3 sets', duration: '15 reps', description: 'Strengthens glutes and posterior chain. Weak glutes are a primary driver of chronic low back pain in athletes' },
          { name: 'Thoracic Mobility Exercises', sets: '2 times daily', duration: '10 reps', description: 'Foam roller thoracic extension, seated rotations. Stiff thoracic spine forces the lumbar spine to compensate' },
        ],
      },
      {
        name: 'Phase 3: Full Return to Activity',
        days: 'Weeks 6–10',
        goals: ['Return to sport and heavy training', 'Sustainable long-term back health strategies', 'Prevention education'],
        exercises: [
          { name: 'Progressive Loaded Training', sets: '3-4 sets', duration: '8-12 reps', description: 'Deadlift, squat, pressing, rowing patterns. Strong posterior chain and core are the best protection against recurrent back pain' },
          { name: 'Sport-Specific Conditioning', sets: '3-4 sessions/week', duration: 'Progressive', description: 'Return to running, sprinting, cutting, throwing — as pain allows. No restriction at 8-10 weeks with full strength symmetry' },
          { name: 'Posture & Ergonomics Education', sets: 'Daily habits', duration: 'Ongoing', description: 'Sitting limits, sleep positions, lifting cues. Poor daily movement habits are the most common cause of recurrent back pain in athletes' },
        ],
      },
    ],
  },

  'bone-ankle': {
    title: 'Ankle Fracture Recovery Protocol',
    categoryLabel: 'Bone Break',
    duration: '8-16 weeks',
    phases: [
      {
        name: 'Phase 1: Protection & Non-Weight-Bearing',
        days: 'Weeks 1–6 (surgeon directed)',
        goals: ['Protect fracture healing', 'Maintain cardiovascular fitness', 'Manage swelling and muscle atrophy'],
        exercises: [
          { name: 'Upper Body Conditioning', sets: '4-5 sessions/week', duration: '20-30 minutes', description: 'Seated upper body resistance training and arm ergometer. Maintains fitness without ankle loading. Essential during immobilization' },
          { name: 'Quad Sets & Hip Strengthening', sets: '3 times daily', duration: '15 reps each exercise', description: 'Isometric quad contractions, hip abduction, prone hip extension. Prevents atrophy in the immobilized limb while protecting the fracture' },
          { name: 'Swelling Management', sets: '4-6 times daily', duration: '20 minutes each', description: 'Elevate ankle above heart level. Ice if not in cast (confirm with surgeon). Reduces swelling that delays healing' },
          { name: 'Mental Skills & Visualization', sets: 'Daily', duration: '10-15 minutes', description: 'Motor imagery and visualization of normal movement. Reduces neural pathway deterioration during immobilization' },
        ],
      },
      {
        name: 'Phase 2: Weight-Bearing Progression',
        days: 'Weeks 6–10',
        goals: ['Restore full weight-bearing', 'Regain ankle range of motion', 'Rebuild calf and ankle strength'],
        exercises: [
          { name: 'Partial Weight-Bearing Walks', sets: 'Progressive', duration: 'Build over 2-3 weeks', description: 'Follow surgeon/physio clearance. Progress from 25% to full weight-bearing with crutch assist. Monitor pain throughout' },
          { name: 'Ankle Range of Motion Exercises', sets: '4 times daily', duration: '10 reps each direction', description: 'Ankle alphabet, plantar/dorsiflexion, inversion/eversion — within pain-free range. Critical to restore motion early' },
          { name: 'Calf Raises (bilateral)', sets: '3 sets', duration: '15-20 reps', description: 'Begin with both feet once fully weight-bearing. Focus on full range. Calf atrophy is significant after ankle fracture immobilization' },
          { name: 'Balance Board Training', sets: '3 sets', duration: '60-second holds', description: 'Begin with flat board, progress to wobble board. Proprioception is severely impaired after ankle fracture — this is critical for injury prevention' },
        ],
      },
      {
        name: 'Phase 3: Strength & Sport Return',
        days: 'Weeks 10–16',
        goals: ['Full strength and proprioception', 'Return to running and jumping', 'Sport-specific functional movement'],
        exercises: [
          { name: 'Single-Leg Calf Raises', sets: '3 sets', duration: '15 reps', description: 'Progress to single-leg calf raises. Goal: equal reps and strength to the uninjured side before return to sport' },
          { name: 'Agility Ladder Drills', sets: '4 sets', duration: '15 metres', description: 'Forward, lateral, and diagonal patterns. Rebuilds ankle coordination and rapid reactive movement' },
          { name: 'Jogging Progression', sets: '3 sessions/week', duration: 'Walk-jog intervals', description: 'Begin jogging when single-leg calf raises are pain-free. Progress distance and speed over 3-4 weeks' },
          { name: 'Plyometric Progression', sets: '3 sets', duration: '10 reps', description: 'Double-leg jumps → single-leg hops → lateral bounding. Return to jumping only when fracture is confirmed healed on imaging' },
        ],
      },
    ],
  },

  'bone-knee': {
    title: 'Knee Fracture Recovery Protocol',
    categoryLabel: 'Bone Break',
    duration: '10-20 weeks',
    phases: [
      {
        name: 'Phase 1: Immobilization & Conservative Management',
        days: 'Weeks 1–8 (surgeon directed)',
        goals: ['Protect fracture site', 'Minimize muscle atrophy', 'Maintain upper body and contralateral leg strength'],
        exercises: [
          { name: 'Quad Sets (isometric)', sets: '5 times daily', duration: '10 x 5-second holds', description: 'Tighten quadriceps without moving the knee. Prevents severe quad atrophy during immobilization. Begin Day 1 if cleared' },
          { name: 'Straight Leg Raises', sets: '3 sets', duration: '15 reps', description: 'Lying on back, lift straight leg to 45°. Maintains quad strength without knee joint movement. Critical during brace/cast phase' },
          { name: 'Hip Strengthening', sets: '3 sets', duration: '15 reps each exercise', description: 'Hip abduction, extension, and rotation exercises in non-weight-bearing positions. Preserves proximal strength' },
          { name: 'Upper Body & Contralateral Training', sets: '4-5 sessions/week', duration: '30 minutes', description: 'Maintain fitness and overall strength. Research shows contralateral leg training has a cross-education effect on the immobilized limb' },
        ],
      },
      {
        name: 'Phase 2: Mobility & Progressive Loading',
        days: 'Weeks 8–14',
        goals: ['Restore knee range of motion', 'Progress from partial to full weight-bearing', 'Regain quad and hamstring strength'],
        exercises: [
          { name: 'Knee Flexion Mobilization', sets: '4 times daily', duration: '10 slow reps', description: 'Seated, slide foot back to increase knee flexion. Use towel for assistance. Goal: 90° by week 10, 120° by week 12' },
          { name: 'Leg Press (low load)', sets: '3 sets', duration: '15 reps', description: 'Seated leg press with minimal load through comfortable range. Progress range and load weekly as cleared by surgeon' },
          { name: 'Cycling (stationary)', sets: 'Daily', duration: '15-20 minutes', description: 'Begin when 90° flexion achieved. Excellent joint-friendly strengthening and range of motion exercise' },
          { name: 'Balance Training', sets: '3 sets', duration: '60-second holds', description: 'Begin double-leg balance, progress to single-leg. Proprioception recovery is essential for return to sport safety' },
        ],
      },
      {
        name: 'Phase 3: Functional Return',
        days: 'Weeks 14–20',
        goals: ['Full strength symmetry', 'Return to running and sport', 'Fracture confirmed healed on imaging'],
        exercises: [
          { name: 'Squat Progression', sets: '3 sets', duration: '12 reps', description: 'Bodyweight → goblet → barbell squat. Achieve full depth with 90% symmetry to uninjured leg before sport return' },
          { name: 'Plyometric Grading', sets: '3 sets', duration: '10 reps', description: 'Double-leg → single-leg landing progressions. Only when bone healing confirmed on X-ray or MRI by treating surgeon' },
          { name: 'Running Progression', sets: '3 sessions/week', duration: 'Walk-jog-run protocol', description: 'Gradual return to full-speed running over 4-6 weeks. Knee fracture return to running typically at 14-16 weeks minimum' },
        ],
      },
    ],
  },

  'bone-shoulder': {
    title: 'Shoulder Fracture Recovery Protocol',
    categoryLabel: 'Bone Break',
    duration: '8-16 weeks',
    phases: [
      {
        name: 'Phase 1: Protection & Immobilization',
        days: 'Weeks 1–4',
        goals: ['Protect fracture healing', 'Control pain and swelling', 'Maintain elbow, wrist, and hand mobility'],
        exercises: [
          { name: 'Elbow, Wrist & Hand Exercises', sets: '4 times daily', duration: '10 reps each', description: 'While arm is in sling: elbow flexion/extension, wrist circles, finger grip. Prevents stiffness below the fracture site' },
          { name: 'Scapular Retraction', sets: '3 times daily', duration: '10 x 5-second holds', description: 'Gentle shoulder blade squeezes. Activates periscapular muscles without moving the fracture site. Approved in most cases' },
          { name: 'Pendulum Exercises (if cleared)', sets: '3 times daily', duration: '20 circles each direction', description: 'Lean forward, let arm hang freely and make small circles. Gentle glenohumeral mobilization. Confirm with surgeon first' },
          { name: 'Lower Body & Core Training', sets: '3-4 sessions/week', duration: '20-30 minutes', description: 'Maintain leg and core fitness. Safe with arm in sling. Squats, lunges, single-leg work, core stability exercises' },
        ],
      },
      {
        name: 'Phase 2: Range of Motion Restoration',
        days: 'Weeks 4–10',
        goals: ['Restore full pain-free shoulder range of motion', 'Rebuild rotator cuff and scapular strength', 'Progress from sling to full use'],
        exercises: [
          { name: 'Assisted Shoulder Flexion', sets: '3 sets', duration: '10 reps', description: 'Use the unaffected arm or a pulley to assist shoulder flexion overhead. Progress range weekly as healing allows' },
          { name: 'External & Internal Rotation', sets: '3 sets', duration: '15 reps each direction', description: 'Lying on back with elbow at 90°, rotate the arm. Restores rotator cuff range and begins gentle strengthening' },
          { name: 'Rotator Cuff Isometrics', sets: '3 sets', duration: '10 x 8-second holds', description: 'Isometric resistance in abduction, flexion, external rotation. Safe way to begin rotator cuff activation post-fracture' },
          { name: 'Theraband Rows', sets: '3 sets', duration: '15 reps', description: 'Light resistance band rowing. Builds mid-back and scapular strength that unloads the healing shoulder' },
        ],
      },
      {
        name: 'Phase 3: Strength & Sport Return',
        days: 'Weeks 10–16',
        goals: ['Full overhead strength and stability', 'Return to throwing or contact sport', 'Achieve strength symmetry'],
        exercises: [
          { name: 'Overhead Press Progression', sets: '3 sets', duration: '10-12 reps', description: 'Dumbbell → barbell overhead press at gradually increasing load. Achieve equal strength to uninjured side' },
          { name: 'Pull-Ups / Lat Pulldown', sets: '3 sets', duration: '10-12 reps', description: 'Vertical pulling movement. Full shoulder stability test. Return to pull-ups when full pain-free ROM is achieved' },
          { name: 'Throwing Progression (if applicable)', sets: 'Gradual', duration: '4-6 week protocol', description: 'Begin with 10-metre soft toss, progress to full velocity. Throwing after shoulder fracture requires careful progression over 4-6 weeks' },
          { name: 'Contact Sport Clearance', sets: 'Single event', duration: 'Medical clearance required', description: 'Full contact sport return requires imaging confirmation of healing and sports medicine clearance. Typically 14-16 weeks post-fracture' },
        ],
      },
    ],
  },

  'bone-rib': {
    title: 'Rib Fracture Recovery Protocol',
    categoryLabel: 'Bone Break',
    duration: '4-10 weeks',
    phases: [
      {
        name: 'Phase 1: Pain Management & Breathing',
        days: 'Weeks 1–3',
        goals: ['Manage pain while preventing pneumonia', 'Maintain full breathing depth', 'Protect fracture site'],
        exercises: [
          { name: 'Incentive Spirometer / Deep Breathing', sets: '10 times per hour while awake', duration: '5 deep breaths each', description: 'The most critical exercise for rib fractures. Prevents pneumonia and atelectasis. Take slow, deep breaths to full capacity despite the pain. Pain control (medication) makes this possible' },
          { name: 'Cough Technique', sets: 'As needed', duration: 'Supported cough', description: 'Place pillow or folded towel firmly against ribs when coughing. The "splinted cough" reduces pain and allows effective airway clearance' },
          { name: 'Posture Education', sets: 'Continuous', duration: 'All waking hours', description: 'Avoid hunching or splinting the injured side. Maintain upright posture to allow full lung expansion. Sitting upright is better than lying flat' },
          { name: 'Gentle Walking', sets: '3-4 times daily', duration: '5-10 minutes', description: 'Short walks maintain circulation and lung function. Avoid activities that significantly increase chest wall pain' },
        ],
      },
      {
        name: 'Phase 2: Progressive Activity',
        days: 'Weeks 3–6',
        goals: ['Return to aerobic activity', 'Restore trunk rotation and mobility', 'Manage chronic rib discomfort'],
        exercises: [
          { name: 'Walking Progression', sets: 'Daily', duration: 'Build to 30+ minutes', description: 'Progressively increase walking distance and pace. Rib pain diminishes significantly by weeks 4-6 in most cases' },
          { name: 'Thoracic Rotation (seated)', sets: '3 times daily', duration: '10 reps each direction', description: 'Seated, arms crossed, rotate gently to each side. Reduces intercostal stiffness that develops around the fracture site' },
          { name: 'Breathing Expansion Exercises', sets: '3 times daily', duration: '5 reps each pattern', description: 'Lateral breathing, posterior basal expansion. Direct the breath into different regions of the chest to restore full lung expansion' },
          { name: 'Low-Impact Cycling', sets: '4 sessions/week', duration: '15-20 minutes', description: 'Upright cycling without impact forces. Appropriate at 3-4 weeks if pain is controlled. Avoid leaning over the handlebars aggressively' },
        ],
      },
      {
        name: 'Phase 3: Return to Sport',
        days: 'Weeks 6–10',
        goals: ['Full return to contact sport', 'Core strength restoration', 'Rib protection strategy for contact athletes'],
        exercises: [
          { name: 'Core & Trunk Rotation Exercises', sets: '3 sets', duration: '12-15 reps', description: 'Pallof press, cable woodchops, medicine ball rotational throws. Restores rotational power needed for sport' },
          { name: 'Non-Contact Sport Return', sets: 'Progressive', duration: '25% → 100% over 2-3 weeks', description: 'Return to full running, swimming, cycling, and field sport training at 6 weeks if pain-free. Monitor for any chest wall pain' },
          { name: 'Contact Sport Clearance', sets: 'Weeks 8-10', duration: 'Gradual contact introduction', description: 'Return to contact drills at 8 weeks with protective padding. Full unrestricted contact at 10 weeks in most athletes. Rib padding recommended for season remainder' },
          { name: 'Rib Protection Strategy', sets: 'Ongoing', duration: 'For 6 months', description: 'Wear protective rib padding for contact sport for up to 6 months. Athletes with prior rib fractures have higher re-fracture risk at the same site' },
        ],
      },
    ],
  },

  'bone-other': {
    title: 'General Fracture Recovery Protocol',
    categoryLabel: 'Bone Break',
    duration: '6-16 weeks',
    phases: [
      {
        name: 'Phase 1: Protection & Immobilization',
        days: 'Weeks 1–6 (surgeon directed)',
        goals: ['Protect fracture healing', 'Minimize muscle atrophy in immobilized area', 'Maintain fitness in unaffected regions'],
        exercises: [
          { name: 'Isometric Contractions', sets: '5 times daily', duration: '10 x 5-second holds', description: 'Isometric contractions of muscles around the fracture site (surgeon permitting). Maintains muscle tone without moving the bone' },
          { name: 'Surrounding Joint Mobility', sets: '4 times daily', duration: '10 reps each joint', description: 'Move all joints above and below the fracture site that are NOT immobilized. Prevents stiffness and maintains circulation' },
          { name: 'Contralateral & Unaffected Limb Training', sets: '4-5 sessions/week', duration: '30 minutes', description: 'Full training of all unaffected body parts. Cross-education effect means training the uninjured limb slows atrophy in the immobilized one' },
          { name: 'Elevation & Swelling Control', sets: 'As often as possible', duration: 'All non-activity time', description: 'Elevate injured limb above heart level when resting. Reduces swelling that can delay bone healing and prolong recovery' },
        ],
      },
      {
        name: 'Phase 2: Progressive Loading',
        days: 'Weeks 6–12',
        goals: ['Restore joint range of motion', 'Begin functional loading of healing bone', 'Regain muscle strength'],
        exercises: [
          { name: 'Range of Motion Exercises', sets: '4 times daily', duration: '10 reps each direction', description: 'Progressive joint mobilization as cleared by surgeon. Goal: restore full range within 6-8 weeks of beginning mobility work' },
          { name: 'Low-Load Resistance Training', sets: '3 sets', duration: '15-20 reps', description: 'Light resistance exercises for the affected area. Bone responds to progressive mechanical stress — complete immobilization is outdated practice' },
          { name: 'Aquatic Exercise', sets: '3-4 sessions/week', duration: '20-25 minutes', description: 'Water reduces compressive load by up to 90% in waist-deep water. Ideal for early progressive weight-bearing through healing bone' },
          { name: 'Balance & Proprioception', sets: '3 sets', duration: '60-second holds', description: 'Fractures cause significant proprioceptive deficit. Early balance training dramatically improves return to sport outcomes' },
        ],
      },
      {
        name: 'Phase 3: Full Functional Return',
        days: 'Weeks 12–16',
        goals: ['Achieve strength symmetry', 'Return to sport-specific loading', 'Imaging-confirmed fracture healing'],
        exercises: [
          { name: 'Progressive Sport-Specific Loading', sets: '3-4 sessions/week', duration: 'Graduated intensity', description: 'Return to sport-specific movement patterns at progressively increasing intensity. All high-impact return requires imaging confirmation of healing' },
          { name: 'Plyometric Grading', sets: '3 sets', duration: '8-10 reps', description: 'Low-impact to high-impact jumping/landing progressions. Only begin when cleared by surgeon and full pain-free strength symmetry is achieved' },
          { name: 'Full Sport Participation', sets: 'Gradual', duration: '25% → 100% over 4 weeks', description: 'Return to full training and competition. Discuss return-to-sport criteria with surgeon and physiotherapist. Bone remodeling continues 12-24 months post-fracture' },
        ],
      },
    ],
  },
};
