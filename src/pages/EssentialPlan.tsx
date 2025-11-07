"use client";

import React from 'react';
import PlanDetailLayout from '@/components/PlanDetailLayout';
import { PLAN_DETAILS } from '@/data/planDetails';

const EssentialPlan = () => {
  const plan = PLAN_DETAILS['Essential'];
  return <PlanDetailLayout plan={plan} />;
};

export default EssentialPlan;