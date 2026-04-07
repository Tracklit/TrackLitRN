export type ProgramSource = 'created' | 'assigned' | 'self_assigned' | 'purchased';

export const describeProgramSource = (
  source: ProgramSource | undefined,
  assignerName: string | undefined,
): string | null => {
  switch (source) {
    case 'created':
      return 'Your program';
    case 'self_assigned':
      return 'Self-started';
    case 'assigned':
      return assignerName ? `Assigned by @${assignerName}` : 'Assigned to you';
    case 'purchased':
      return 'Purchased';
    default:
      return null;
  }
};
