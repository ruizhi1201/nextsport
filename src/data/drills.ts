export interface Drill {
  id: string;
  name: string;
  category: string;
  description: string;
  focusPoints: string[];
  commonMistakes: string[];
}

export const drills: Drill[] = [
  {
    id: "1",
    name: "Tee Work - Contact Point",
    category: "Bat Path",
    description: "Set tee 6 inches in front of plate. Focus on driving through contact.",
    focusPoints: ["Keep barrel in zone longer", "Drive through the ball", "Full extension after contact"],
    commonMistakes: ["Rolling wrists too early", "Contacting ball too deep"],
  },
  {
    id: "2",
    name: "Hip Rotation Drill",
    category: "Sequencing",
    description: "Hold bat across shoulders. Practice hip firing before upper body.",
    focusPoints: ["Hips lead hands", "Feel the separation", "Back heel up at finish"],
    commonMistakes: ["Upper body leading", "Rushing the swing"],
  },
  {
    id: "3",
    name: "Stride Consistency",
    category: "Timing",
    description: "Practice stride to the same spot every rep.",
    focusPoints: ["Soft toe touch", "Same stride length", "Keep hands back during stride"],
    commonMistakes: ["Striding too hard", "Drifting forward"],
  },
  {
    id: "4",
    name: "One-Handed Extension",
    category: "Bat Path",
    description: "Swing with lead arm only, focus on extension through zone.",
    focusPoints: ["Keep elbow slot", "Extend toward pitcher", "Level swing path"],
    commonMistakes: ["Casting the barrel", "Dropping the elbow"],
  },
  {
    id: "5",
    name: "Balance Beam Stance",
    category: "Balance",
    description: "Set up in stance on a 2x4 board. Hold balanced position for 10 seconds.",
    focusPoints: ["Weight on balls of feet", "Athletic posture", "Stable base"],
    commonMistakes: ["Heels too heavy", "Locked knees"],
  },
  {
    id: "6",
    name: "Load and Hold",
    category: "Load",
    description: "Practice the load position and hold for 3 seconds before swinging.",
    focusPoints: ["Slight inward hip turn", "Hands stay back", "Weight loaded on back leg"],
    commonMistakes: ["Loading too late", "Hands drifting forward"],
  },
  {
    id: "7",
    name: "Short Stop Drill",
    category: "Sequencing",
    description: "Hit off front toss, stopping at contact position. Hold 3 seconds.",
    focusPoints: ["Hips open at contact", "Front leg braced", "Head down at contact"],
    commonMistakes: ["Pulling off the ball", "Head flying out"],
  },
  {
    id: "8",
    name: "Posture Check",
    category: "Posture",
    description: "Film yourself from the side in stance. Check spine angle vs contact.",
    focusPoints: ["Maintain spine angle", "No upper body lurch", "Slight forward tilt from hips"],
    commonMistakes: ["Standing up through swing", "Bending at waist"],
  },
  {
    id: "9",
    name: "Soft Toss - Inside Pitch",
    category: "Bat Path",
    description: "Inside pitch soft toss. Focus on pulling hands through.",
    focusPoints: ["Lead with hands", "Keep barrel inside ball", "Quick hip turn"],
    commonMistakes: ["Casting barrel", "Hitting with arms only"],
  },
  {
    id: "10",
    name: "Pepper Game",
    category: "Timing",
    description: "Rapid-fire short swings from close toss. Build rhythm and timing.",
    focusPoints: ["Short compact swing", "Quick hands", "Eye on ball"],
    commonMistakes: ["Big looping swing", "Not tracking ball"],
  },
  {
    id: "11",
    name: "Back Foot Pivot",
    category: "Sequencing",
    description: "Exaggerate back foot pivot/squish the bug on every swing.",
    focusPoints: ["Back heel comes up", "Pivot on ball of foot", "Full rotation"],
    commonMistakes: ["Flat back foot", "Spinning out"],
  },
  {
    id: "12",
    name: "Plate Coverage Toss",
    category: "Bat Path",
    description: "Toss to inside, middle, outside. Hit each location correctly.",
    focusPoints: [
      "Outside pitch: hit to opposite field",
      "Inside: pull with quick hands",
      "Middle: drive up the middle",
    ],
    commonMistakes: ["Same swing for all locations", "No adjustment"],
  },
];

export const drillCategories = ["All", "Balance", "Load", "Sequencing", "Bat Path", "Timing", "Posture"];
