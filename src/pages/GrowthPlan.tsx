"use client";

import React from 'react';
import PlanDetailLayout from '@/components/PlanDetailLayout';
import { PLAN_DETAILS } from '@/data/planDetails';

const GrowthPlan = () => {
  const plan = PLAN_DETAILS['Business Growth'];
  return <PlanDetailLayout plan={plan} />;
};

export default GrowthPlan;