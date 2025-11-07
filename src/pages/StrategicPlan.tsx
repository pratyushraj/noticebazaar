"use client";

import React from 'react';
import PlanDetailLayout from '@/components/PlanDetailLayout';
import { PLAN_DETAILS } from '@/data/planDetails';

const StrategicPlan = () => {
  const plan = PLAN_DETAILS['Strategic Partner'];
  return <PlanDetailLayout plan={plan} />;
};

export default StrategicPlan;