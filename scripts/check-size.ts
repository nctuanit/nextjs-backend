import fs from "fs";
import path from "path";

const distPath = path.join(process.cwd(), "dist");

if (!fs.existsSync(distPath)) {
  console.error("❌ Thư mục 'dist' không tồn tại. Đang biên dịch...");
  process.exit(1);
}

const files = fs.readdirSync(distPath).filter(file => file.endsWith('.js') || file.endsWith('.d.ts'));

console.log("\n📦 Kích thước file Build (dist/):");
console.log("--------------------------------------------------");

let totalSize = 0;

for (const file of files) {
  const filePath = path.join(distPath, file);
  const stats = fs.statSync(filePath);
  
  if (stats.isFile()) {
    const sizeKB = (stats.size / 1024).toFixed(2);
    totalSize += stats.size;
    
    // Pad the file name for nice formatting
    const paddedName = file.padEnd(25, " ");
    console.log(`📄 ${paddedName} : ${sizeKB.padStart(6, " ")} KB`);
  }
}

console.log("--------------------------------------------------");
console.log(`🚀 Tổng cộng: ${(totalSize / 1024).toFixed(2)} KB\n`);
