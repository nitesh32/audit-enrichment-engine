/** Realistic sample evidence for the "Use example" button; each differs in entity, control, amount and risk. */
export const EXAMPLE_EVIDENCE = [
  {
    entityName: 'Atlas Freight Partners',
    description: 'Manual approval override executed for vendor invoice payables exceeding $50k threshold',
    monetaryImpact: '88500',
    controlId: 'CTRL-FIN-302',
  },
  {
    entityName: 'Meridian Treasury Services',
    description: 'Urgent cash disbursement approved as an exception outside the normal process',
    monetaryImpact: '32400',
    controlId: 'CTRL-FIN-118',
  },
  {
    entityName: 'Northstar Consulting Group',
    description: 'Consulting retainer paid without a purchase order',
    monetaryImpact: '100000',
    controlId: 'CTRL-PRC-204',
  },
  {
    entityName: 'Helios Facilities Management',
    description: 'Routine monthly subscription payment for office software licences',
    monetaryImpact: '1850',
    controlId: 'CTRL-OPS-110',
  },
  {
    entityName: 'Orion Payroll Services',
    description: 'Bypass of dual approval on payroll adjustment for a terminated employee',
    monetaryImpact: '47250',
    controlId: 'CTRL-FIN-410',
  },
  {
    entityName: 'Vertex Cloud Solutions',
    description: 'Privileged access granted to the production ledger without a change ticket',
    monetaryImpact: '15000',
    controlId: 'CTRL-IT-207',
  },
];
