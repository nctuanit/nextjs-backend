#!/bin/bash
set -e

# Hiển thị màu sắc
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RESET='\033[0m'

echo -e "${CYAN}🚀 Chọn loại bản cập nhật (SemVer):${RESET}"
echo "1) 🐛 Nhỏ (Patch) - Tự động tăng v1.0.x (Fix bug, thay đổi nhỏ)"
echo "2) ✨ Vừa (Minor) - Tự động tăng v1.x.0 (Thêm tính năng mới)"
echo "3) 💥 Lớn (Major) - Tự động tăng vx.0.0 (Thay đổi lớn, phá vỡ tương thích)"
echo "4) 📝 Chỉ Push Code (Không đổi version)"
echo -n "Nhập số (1-4) [4]: "
read choice

if [ -z "$choice" ]; then
  choice=4
fi

VERSION_TYPE=""
case $choice in
  1) VERSION_TYPE="patch" ;;
  2) VERSION_TYPE="minor" ;;
  3) VERSION_TYPE="major" ;;
  4) VERSION_TYPE="none" ;;
  *) echo "Lựa chọn không hợp lệ!"; exit 1 ;;
esac

# Yêu cầu nhập commit message
echo -n -e "\n${YELLOW}Nhập commit message:${RESET} "
read COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
  echo "Commit message không được để trống!"
  exit 1
fi

echo -e "\n${GREEN}1. Đang thêm các file vào Git...${RESET}"
git add .

echo -e "\n${GREEN}2. Đang tạo commit...${RESET}"
git commit -m "$COMMIT_MSG" || true

if [ "$VERSION_TYPE" != "none" ]; then
  echo -e "\n${GREEN}3. Đang cập nhật phiên bản ($VERSION_TYPE)...${RESET}"
  # npm version tự động update package.json, tạo tag và commit cho version
  npm version $VERSION_TYPE -m "chore(release): %s"
  
  echo -e "\n${GREEN}4. Đang Push Code và Tags lên GitHub...${RESET}"
  git push --follow-tags
else
  echo -e "\n${GREEN}3. Đang Push Code lên GitHub...${RESET}"
  git push
fi

echo -e "\n${CYAN}🎉 Hoàn tất thành công!${RESET}"
