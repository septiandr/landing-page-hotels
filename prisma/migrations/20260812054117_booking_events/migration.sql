-- CreateTable
CREATE TABLE "BookingEvent" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingEvent_reservationId_key" ON "BookingEvent"("reservationId");

-- CreateIndex
CREATE INDEX "BookingEvent_event_processedAt_idx" ON "BookingEvent"("event", "processedAt");
