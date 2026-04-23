-- CreateTable
CREATE TABLE "RetirementSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "currentAge" INTEGER NOT NULL DEFAULT 30,
    "retirementAge" INTEGER NOT NULL DEFAULT 60,
    "lifeExpectancy" INTEGER NOT NULL DEFAULT 85,
    "currentSavings" REAL NOT NULL DEFAULT 0,
    "expectedReturn" REAL NOT NULL DEFAULT 5,
    "inflationRate" REAL NOT NULL DEFAULT 3,
    "monthlyExpense" REAL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RetirementSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RetirementSetting_userId_key" ON "RetirementSetting"("userId");
