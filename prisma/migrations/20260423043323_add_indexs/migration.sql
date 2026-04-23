-- CreateIndex
CREATE INDEX "Budget_userId_idx" ON "Budget"("userId");

-- CreateIndex
CREATE INDEX "Budget_userId_type_idx" ON "Budget"("userId", "type");

-- CreateIndex
CREATE INDEX "Budget_userId_year_idx" ON "Budget"("userId", "year");

-- CreateIndex
CREATE INDEX "MapPin_userId_idx" ON "MapPin"("userId");

-- CreateIndex
CREATE INDEX "Trip_userId_idx" ON "Trip"("userId");

-- CreateIndex
CREATE INDEX "Trip_userId_status_idx" ON "Trip"("userId", "status");
