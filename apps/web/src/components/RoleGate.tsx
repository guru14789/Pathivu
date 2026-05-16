import React from 'react';
import { useAbility } from '@casl/react';
import { AbilityContext } from '../lib/ability';
import { Actions, Subjects } from '../lib/ability';

interface RoleGateProps {
  children: React.ReactNode;
  I: Actions;
  a: Subjects;
  field?: string;
}

const RoleGate: React.FC<RoleGateProps> = ({ children, I, a, field }) => {
  const ability = React.useContext(AbilityContext);
  
  if (ability.can(I, a as any, field)) {
    return <>{children}</>;
  }

  return null;
};

export default RoleGate;
