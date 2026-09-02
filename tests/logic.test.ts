import { test } from "node:test";
import assert from "node:assert/strict";
import { canTransition, timelineIndex, TIMELINE_STAGES } from "../lib/workflow";
import { isInstituteEmail } from "../lib/domain";
import { portalOf, isStaff, canApprove } from "../lib/roles";

test("workflow: valid transitions are allowed", () => {
  assert.ok(canTransition("SUBMITTED", "UNDER_REVIEW"));
  assert.ok(canTransition("UNDER_REVIEW", "APPROVED"));
  assert.ok(canTransition("UNDER_REVIEW", "CORRECTION_REQUIRED"));
  assert.ok(canTransition("CORRECTION_REQUIRED", "CORRECTION_SUBMITTED"));
  assert.ok(canTransition("APPROVED", "PROCESSING"));
  assert.ok(canTransition("PROCESSING", "READY"));
  assert.ok(canTransition("READY", "COMPLETED"));
});

test("workflow: invalid transitions are rejected", () => {
  assert.equal(canTransition("SUBMITTED", "APPROVED"), false);
  assert.equal(canTransition("SUBMITTED", "COMPLETED"), false);
  assert.equal(canTransition("REJECTED", "UNDER_REVIEW"), false);
  assert.equal(canTransition("COMPLETED", "PROCESSING"), false);
  assert.equal(canTransition("UNDER_REVIEW", "READY"), false);
});

test("workflow: timeline index maps correction & rejection to review stage", () => {
  assert.equal(timelineIndex("SUBMITTED"), 0);
  assert.equal(timelineIndex("CORRECTION_REQUIRED"), 1);
  assert.equal(timelineIndex("REJECTED"), 1);
  assert.equal(timelineIndex("READY"), 4);
  assert.equal(timelineIndex("COMPLETED"), TIMELINE_STAGES.length);
});

test("domain: only institute emails are accepted for students", () => {
  assert.ok(isInstituteEmail("2025btecs012@mitaoe.ac.in"));
  assert.ok(isInstituteEmail("Rahul.Patil@MITAOE.AC.IN")); // case-insensitive
  assert.equal(isInstituteEmail("someone@gmail.com"), false);
  assert.equal(isInstituteEmail("someone@yahoo.com"), false);
  assert.equal(isInstituteEmail("no-domain"), false);
  assert.equal(isInstituteEmail("fake@mitaoe.ac.in.evil.com"), false);
});

test("roles: portal mapping and permissions", () => {
  assert.equal(portalOf("STUDENT"), "student");
  assert.equal(portalOf("OFFICE_STAFF"), "staff");
  assert.equal(portalOf("ADMIN"), "staff");

  assert.equal(isStaff("STUDENT"), false);
  assert.equal(isStaff("APPROVER"), true);

  // Only approvers/admins can approve; office staff & faculty cannot.
  assert.equal(canApprove("APPROVER"), true);
  assert.equal(canApprove("ADMIN"), true);
  assert.equal(canApprove("OFFICE_STAFF"), false);
  assert.equal(canApprove("FACULTY"), false);
});
