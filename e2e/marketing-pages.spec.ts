import { test, expect } from "@playwright/test";

const marketingPages = [
  {
    path: "/welcome",
    heading: "프롬프트를 전문가 수준으로 — 로컬에서, 무료로",
  },
  { path: "/pricing", heading: "가격" },
  { path: "/privacy", heading: "개인정보 처리방침" },
  { path: "/terms", heading: "이용약관" },
];

test("renders every marketing page with its primary heading", async ({
  page,
}) => {
  for (const { path, heading } of marketingPages) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: heading, level: 1 }),
    ).toBeVisible();
  }
});

test("pricing shows both plan names and welcome CTA navigates to the dashboard", async ({
  page,
}) => {
  await page.goto("/pricing");
  await expect(page.getByText("Free · 현재 이용 가능")).toBeVisible();
  await expect(page.getByText("Pro · 준비 중")).toBeVisible();

  await page.goto("/welcome");
  await page.getByRole("link", { name: "바로 시작하기" }).click();
  await page.getByRole("navigation", { name: "주요 메뉴" }).waitFor();
  await expect(page).toHaveURL("/");
});
