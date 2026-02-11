-- 034: Add 'trial' to role and plan CHECK constraints
-- Trial: 2-week period, 0 grace days

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_role_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_role_check CHECK (role IN ('member', 'trial', 'admin'));

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('monthly', 'yearly', 'trial'));
