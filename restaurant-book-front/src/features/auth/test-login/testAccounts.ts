export type TestAccount = {
  roleCode: string;
  label: string;
  email: string;
  password: string;
};

const emailDomain =
  process.env.NEXT_PUBLIC_TEST_ACCOUNT_DOMAIN ?? "restaurantbook.local";
const password =
  process.env.NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD ?? "password123";

export const TEST_LOGIN_ENABLED =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_ENABLE_TEST_LOGIN !== "false";

export const TEST_ACCOUNTS: TestAccount[] = [
  { roleCode: "ROLE_ADMIN", label: "관리자", email: `admin@${emailDomain}`, password },
  { roleCode: "ROLE_MANAGER", label: "매니저", email: `manager@${emailDomain}`, password },
  { roleCode: "ROLE_KITCHEN", label: "주방", email: `kitchen@${emailDomain}`, password },
  { roleCode: "ROLE_STAFF", label: "직원", email: `staff@${emailDomain}`, password },
  { roleCode: "ROLE_CUSTOMER", label: "고객", email: `customer@${emailDomain}`, password },
];
