const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

// Truyền trực tiếp URL để đảm bảo kết nối được
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "sqlserver://localhost:1433;database=PSManagement;user=psmcreator;password=MotSys123@;trustServerCertificate=true"
    }
  }
});

async function resetPassword() {
  const username = "JV";
  const newPassword = "MotSys123@";
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  try {
    const user = await prisma.user.update({
      where: { username },
      data: { password: hashedPassword }
    });
    console.log(`Successfully reset password for user: ${user.username}`);
  } catch (error) {
    console.error("Error resetting password:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
