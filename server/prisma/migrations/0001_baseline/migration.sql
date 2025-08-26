-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'VOLUNTEER');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'VOLUNTEER',
    "name" TEXT NOT NULL,
    "assigned_events" TEXT[],
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_datetime" TIMESTAMP(3) NOT NULL,
    "end_datetime" TIMESTAMP(3) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "image" TEXT,
    "short_descrip" VARCHAR(150) NOT NULL,
    "description" VARCHAR(450) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "place_id" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventTicket" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL,
    "includes_item" BOOLEAN NOT NULL DEFAULT false,
    "item_name" TEXT,

    CONSTRAINT "EventTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchasedTicket" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_ticket_id" TEXT NOT NULL,
    "purchaser_name" TEXT NOT NULL,
    "purchaser_email" TEXT NOT NULL,
    "purchaser_phone" TEXT,
    "assigned_name" TEXT NOT NULL,
    "qr_code" TEXT NOT NULL,
    "checked_in" BOOLEAN NOT NULL DEFAULT false,
    "item" BOOLEAN NOT NULL DEFAULT false,
    "item_collected" BOOLEAN NOT NULL DEFAULT false,
    "purchase_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked_in_at" TIMESTAMP(3),
    "checked_in_by" TEXT,

    CONSTRAINT "PurchasedTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PurchasedTicket_qr_code_key" ON "public"."PurchasedTicket"("qr_code");

-- AddForeignKey
ALTER TABLE "public"."EventTicket" ADD CONSTRAINT "EventTicket_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchasedTicket" ADD CONSTRAINT "PurchasedTicket_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchasedTicket" ADD CONSTRAINT "PurchasedTicket_event_ticket_id_fkey" FOREIGN KEY ("event_ticket_id") REFERENCES "public"."EventTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

