import { mkdir, readdir, stat } from "fs/promises";
import { dirname, extname, parse, resolve } from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const imageGroups = [
  {
    sourceDir: resolve(root, "web/images/articles"),
    outputDir: resolve(root, "miniprogram/article-package/assets/article-mini/uw-series"),
    files: [
      "hcde-class.png", "hcde-interview.png", "hcde-research.png",
      "mhcid-class.jpg", "mhcid-demo.jpg", "mhcid-team.jpg",
      "msti-lab.png", "msti-project.png", "msti-robot.jpg", "msti-soldering.jpg",
      "portfolio-capstone.jpg", "portfolio-poster.jpg", "portfolio-session.jpg",
      "uw-offer-campus.png", "uw-offer-project.png",
      "uw-transfer-building.png", "uw-transfer-campus.png"
    ]
  },
  {
    sourceDir: resolve(root, "web/assets/articles/tud-series"),
    outputDir: resolve(root, "miniprogram/article-package/assets/article-mini/tud-series"),
    files: [
      "1-tud-library-cone.png", "2-tud-aula-sign.png", "3-tud-ceremony.jpg",
      "4-tud-bike-student.png", "5-tud-studio-review.png", "6-tud-maker-space.jpg",
      "7-tud-tennis-coach.png", "8-tud-orange-staircase.jpg", "9-tud-workshop-collage.png",
      "10-tud-emotion-workshop.png", "11-tud-metal-grinder.jpg", "12-tud-design-meeting.jpg",
      "13-tud-3d-printing.jpg", "14-tud-science-centre.png", "15-tud-high-voltage-lab.jpg",
      "16-tud-motion-capture.png", "17-tud-breast-implant-design.png"
    ]
  }
];
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function convertImage(sourcePath, outputPath) {
  const result = spawnSync("ffmpeg", [
    "-hide_banner",
    "-loglevel", "error",
    "-y",
    "-i", sourcePath,
    "-vf", "scale='min(720,iw)':-2",
    "-q:v", "18",
    outputPath
  ], { encoding: "utf8" });

  if (result.error && result.error.code === "ENOENT") {
    throw new Error("ffmpeg is required to generate lightweight mini-program article images.");
  }
  if (result.status !== 0) {
    throw new Error(`Failed to optimize ${sourcePath}: ${result.stderr || result.error}`);
  }
}

export async function buildArticleImages() {
  let generated = 0;
  for (const group of imageGroups) {
    await mkdir(group.outputDir, { recursive: true });
    const availableEntries = new Set(await readdir(group.sourceDir));
    for (const entry of group.files) {
      if (!availableEntries.has(entry)) throw new Error(`Missing legacy article image: ${entry}`);
      if (!supportedExtensions.has(extname(entry).toLowerCase())) continue;
      const sourcePath = resolve(group.sourceDir, entry);
      const outputPath = resolve(group.outputDir, `${parse(entry).name}.jpg`);
      convertImage(sourcePath, outputPath);
      generated += 1;
    }
  }

  console.log(`Prepared lightweight article images (${generated} updated).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildArticleImages().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
