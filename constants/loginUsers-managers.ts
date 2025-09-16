export interface ILoginUser {
  email: string;
  nric: string;
}

export const managerUsers: ILoginUser[] = [
  { email: "bob.manager@system.com", nric: "S8765432B" },
  { email: "manager.one@system.com", nric: "S9711111B" },
  { email: "manager.two@system.com", nric: "S9622222C" },
  { email: "manager.three@system.com", nric: "S9533333D" },
  { email: "manager.four@system.com", nric: "S9444444E" },
  { email: "manager.five@system.com", nric: "S9355555F" },
];
