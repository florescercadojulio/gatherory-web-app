/** Synthetic fixture copied from the user's supplied conference plan; no live catalog lookup. */
export const conferencePlanSourceText =
  '# IBM TechXchange 2026 — personal and Humphrey Products plan\n\nPrepared October 25, 2026 from the live IBM catalog inspected in your Safari session.\n\n**Attendance:** Monday, October 26 around noon through Thursday, October 29 at noon. All times below are Atlanta local time (EDT), which matches Detroit during the event.\n\n**Your priorities:** IBM i learning and modernization with on-premises deployment in mind; Bob for IBM i; backups while keeping the system available; cloud options; and Power11.\n\n**Known configuration:** You described the system as “the latest one.” Exact Power model, IBM i release/PTFs, storage, and backup tooling remain unconfirmed. This plan does not assume a particular version or backup architecture.\n\n**Account status:** Your Safari Registration tab showed the IBM Events login form when checked. That is a separate account from IBMid. This is a recommended itinerary, with no event reservations or account favorites changed. The calendar file is an optional local import and does not reserve seats. Confirm access and any capacity limits in the attendee portal.\n\n## What to bring back\n\n1. **An on-premises modernization pilot:** document and improve one small IBM i application or process, with a test environment, baseline behavior, validation, and rollback.\n2. **A backup-window decision:** compare feasible approaches against Humphrey’s maximum acceptable application pause, recovery time (RTO), and acceptable data loss (RPO).\n3. **A Power11 and cloud decision note:** identify what the current system already provides, what needs configuring or licensing, and whether cloud dev/test or DR adds enough value to justify its ongoing cost.\n\nHumphrey designs and manufactures pneumatic and fluid-control products. My planning inference is to prioritize continuity of business operations and maintainable applications, then evaluate new tools through a bounded pilot. This is not an assertion about Humphrey’s current ERP or internal application architecture. [Humphrey company background](https://www.humphrey-products.com/our-company).\n\n## Recommended agenda\n\nThese are non-overlapping selections with transition time between scheduled sessions. Check rooms and times in the linked catalog before attending. Most IBM i breakouts are in Building C; Sandbox and Building B trips need extra attention.\n\n### Monday, October 26\n\n| Time (EDT) | Session | Location | Purpose |\n|---|---|---|---|\n| 1:00 PM–2:00 PM | [IBM Bob User Group: Part 1 — Meet IBM Bob (MUP-4635)](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=MUP-4635) | B215, Level 2, Building B | Learn Bob’s workflow and identify what is specific to IBM i versus general development. |\n| 3:30 PM–4:30 PM | [IBM Bob User Group: Part 3 — IBM i Development and Modernization (MUP-4637)](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=MUP-4637) | B215, Level 2, Building B | Top priority. RPG/CL/DDS awareness, native tools, modernization use cases, and roadmap. Meet Tim Rowe, Ryan Moeller, and Anjali Kulkarni. |\n| 6:00 PM–9:00 PM | [Opening night block party (optional) (NETWORK)](https://www.ibm.com/events/techxchange/experience) | Sandbox Expo | Find two IBM i practitioners with on-premises systems and ask about their backup and modernization experience. |\n\nUse noon–1:00 for badge pickup, food, and finding B215. The IBM i RPG/Bob lab (LAB-3318) runs only Monday 10:00–11:30 in the inspected catalog, so it does not fit your arrival. Ask the Monday IBM i meetup speakers for its guide or a way to repeat it later.\n\n### Tuesday, October 27\n\n| Time (EDT) | Session | Location | Purpose |\n|---|---|---|---|\n| 9:00 AM–10:00 AM | [Opening general session — Make Your Agents Enterprise Ready (GEN-5572)](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1790115059212001fgKJ) | Hall B4, Building B, GWCC | Optional broad context. Capture only announcements relevant to IBM i, Bob, or operating an on-premises environment. |\n| 10:30 AM–11:15 AM | [Navigating the HA/DR Maze: Make the Right Move (TEC-4380)](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4380) | C212, Level 2, Building C | Top priority. Brian Nordland covers on-premises and cloud resilience choices. Ask for a follow-up on reducing the IBM i backup outage. |\n| 11:30 AM–12:00 PM | [Demo: IBM Bob Premium Package for i (DMO-4677)](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=DMO-4677) | IBM Bob for Infrastructure, Sandbox | Watch the workflow and note prerequisites, platform connections, and how output is validated. |\n| 1:30 PM–2:00 PM | [Meet the Expert: IBM Bob Self-hosted (MTE-5888)](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=MTE-5888) | Expert Bar 01, IBM Bob, Sandbox | Top priority for the on-premises goal. Ask Ryley Wharton about supported models, infrastructure, connectivity, licensing, and compatibility with Premium Package for i. |\n| 2:45 PM–3:30 PM | [IBM Bob & Db2 for i (TEC-4512)](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4512) | C208, Level 2, Building C | Connect Bob evaluation to existing IBM i data and database development; identify one small Humphrey pilot. |\n| 4:00 PM–4:45 PM | [An Overview of IBM i Migrate While Active (TEC-4455)](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4455) | C213, Level 2, Building C | Learn reduced-disruption migration options for hardware refreshes, private cloud, or public cloud. Ask about remaining cutover downtime; this is a migration session, not a backup guarantee. |\n\nProtect 12:00–1:00 for lunch and notes. After the HA/DR session, ask Brian Nordland where and when you can discuss on-premises backup architecture in more detail.\n\n### Wednesday, October 28\n\n| Time (EDT) | Session | Location | Purpose |\n|---|---|---|---|\n| 10:30 AM–11:15 AM | [Creating Virtual IBM i Partitions Hosted by IBM i (TEC-4470)](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4470) | C208, Level 2, Building C | Top priority for an on-premises test environment. Pete Massiello covers IBM i hosting IBM i versus VIOS, prerequisites, virtual storage, and upgrade testing. |\n| 11:30 AM–12:00 PM | [Meet the Expert: Bill Starke — IBM Power (MTE-4977)](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=MTE-4977) | Workbench 03, Infrastructure, Sandbox | Discuss Power11 architecture and what matters for Humphrey’s actual workload. Bring model, processor, memory, storage, and utilization details if available. |\n| 12:30 PM–1:00 PM | [Meet the Expert: Tim Rowe — Bob for IBM i (MTE-5894)](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=MTE-5894) | Expert Bar 01, IBM Bob, Sandbox | Top priority. Confirm the support matrix for IBM i plus self-hosted Bob, code understanding, documentation, modernization, and testing. |\n| 1:30 PM–2:15 PM | [DR Planning Yearly Checkup (TEC-4522)](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4522) | C213, Level 2, Building C | Turn backup discussions into a recoverable plan: recovery steps, dependencies, owners, test frequency, and measurable recovery objectives. |\n| 2:45 PM–3:30 PM | [Optimizing Performance Priorities with Power11 Resource Groups (TEC-1402)](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-1402) | C205, Level 2, Building C | Power11 / PowerVM architecture and performance priorities. Confirm which recommendations apply to IBM i and to Humphrey’s specific model; the presenter also works with AIX. |\n| 4:00 PM–4:20 PM | [Rapid Fire Tips for Using IBM i on PowerVS (TLK-4864)](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TLK-4864) | Tech Talk 08 / 831, COMMON Hub, Sandbox | A compact cloud overview. Explore dev/test or DR use while retaining on-premises production as the planning baseline. |\n\nUse noon–12:30 for lunch and 4:20 onward for follow-ups. Optional evening: TechXchange Unplugged, 7:00–10:00 PM at Georgia Aquarium and World of Coca-Cola.\n\n### Thursday, October 29\n\n| Time (EDT) | Session | Location | Purpose |\n|---|---|---|---|\n| 9:00 AM–9:45 AM | [Deep Dive with IBM Bob Premium Package for i (TEC-4517)](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4517) | C209, Level 2, Building C | Top priority. Tim Rowe demonstrates architecture and programmer use cases. Close remaining questions about an on-premises modernization pilot. |\n| 10:15 AM–11:00 AM | [Full-System Resilience for IBM i on PowerVS: Live Demo (TEC-4499)](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4499) | C213, Level 2, Building C | Top priority for backup concepts. Brian Nordland demonstrates full-system FlashCopy and GRS in PowerVS. Explicitly ask which parts transfer to on-premises storage and what application pause remains. |\n\nFinish formal sessions at 11:00 and protect the remaining hour for departure. This assumes noon means leaving the event; if noon is your flight departure, omit the 10:15 session and arrange a backup discussion earlier. Avoid the 11:00–12:30 labs.\n\n## Questions that matter for Humphrey\n\n### Backups while the system stays available — highest-priority expert discussion\n\nStart with: “We want to retain on-premises IBM i production and reduce or eliminate the application outage during backups. Can you outline supported options for our specific storage and recovery requirements?”\n\n- What is being protected: selected libraries/IFS and application data, or a complete system recovery image? Which operations still require restricted state, quiescing, or a checkpoint wait?\n- How far can save-while-active and BRMS reduce the current window? How are multi-library transactions, journals, IFS objects, and application consistency handled?\n- If FlashCopy or a separate backup partition is appropriate, which storage, licenses, orchestration tools, and spare capacity are required? What is the measured pause on production?\n- Would replication and saving from a secondary system be suitable? How are independent historical copies retained and restores tested?\n- What are the achievable RPO/RTO, implementation effort, ongoing cost, and restore procedure for each option?\n- Can the specialist provide a diagram, prerequisites, and a reference architecture for **on-premises IBM i**, followed by a test plan?\n\nIBM documents save-while-active as saving parts of a system without restricted state, with checkpoint constraints. That does not establish that every full-system backup can run with zero application interruption. IBM also documents backup-window reduction using replication and FlashCopy approaches. The catalog’s full-system demonstration is explicitly PowerVS, so its on-premises applicability must be confirmed. [Save-while-active concepts](https://www.ibm.com/docs/en/i/7.5.0?topic=function-save-while-active-concepts), [backup-window reduction](https://www.ibm.com/docs/en/i/7.5.0?topic=availability-backup-window-reduction).\n\n### Bob for IBM i and self-hosted deployment\n\n- Can Premium Package for i run with the proposed self-hosted Bob deployment? Request the current support matrix, not a roadmap assumption.\n- Which pieces stay on premises: source, prompts, model inference, metadata, logs, credentials, and tool execution? What external connectivity remains necessary?\n- What are the supported IBM i releases, developer workstation tools, server components, models, hardware requirements, and licensing costs?\n- Can we start with code understanding, dependency mapping, business-rule documentation, or tests before changing RPG/CL/DDS or the database?\n- How do we compile, compare behavior, review changes, and roll back? What cannot safely be automated yet?\n\n### Power11 and cloud\n\n- What changes are relevant to our actual Power model, firmware, IBM i release, virtualization, and storage arrangement?\n- Which capabilities require hardware, firmware, PowerVM, or licensing changes? Which Resource Group recommendations apply to IBM i workloads?\n- For any hardware move, what service interruption remains and what must be tested before cutover?\n- Can PowerVS serve a bounded dev/test or DR role while production remains on premises? Obtain realistic compute, storage, connectivity, backup, software, and standby costs, plus an exit/restore path.\n\n## Alternatives — replace a conflicting session, do not stack them\n\n| Alternative | Time / place | Use it when |\n|---|---|---|\n| [From Idea to Application with Bob — LAB-4975](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=LAB-4975) | Mon 4:15–5:45 PM, Lab 04 | You prefer a general hands-on Bob lab over the IBM i meetup. It overlaps the meetup; my recommendation is the IBM i meetup. The Wed 4:45–6:15 repeat can fit if you want a lab later. |\n| [Air-gapped Bob deployment lab — LAB-3069](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=LAB-3069) | Mon 2:15–3:45 PM, Lab 02 | Deployment implementation is more urgent than the IBM i community discussion. It overlaps the 3:30 meetup. The Thu repeat ends after your departure. |\n| [Navigator for i — Administrator’s View — TEC-4459](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4459) | Wed 4:00–4:45 PM, C207 | Daily on-premises administration is more valuable than the short PowerVS overview. |\n| [IBM i MCP Server — TEC-4514](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1783100663083001QMlT) | Thu 10:15–11:00 AM, C209 | Agent integration takes priority over the FlashCopy demo. For your stated backup goal, I favor FlashCopy. |\n| [Power10/Power11 architecture distinctions — TEC-1403](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1776127585244001bhH2) | Thu 9:00–9:45 AM, C205 | Hardware selection is the immediate decision. It conflicts with the Bob deep dive; discuss hardware with Bill Starke Wednesday if you keep Bob. |\n\n## Make the learning usable\n\nBefore each expert conversation, have a short configuration note: Power model, IBM i release/PTFs, internal disks versus external storage and model, backup software and target, current save duration/application outage, data volume and growth, journaling/replication, and the latest successful restore test. Obtain missing details from the appropriate Humphrey owner; no production changes are needed for this preparation.\n\nAfter each session, capture: **one useful idea, one prerequisite or limitation, one Humphrey use case, one contact, and one next action**. Ask speakers where to obtain guides and slides; keep source material separate from your own conclusions.\n\nWithin two business days of returning, share a one-page recommendation with the relevant Humphrey team: one small Bob/IBM i pilot, a backup options comparison, and unresolved Power11/cloud questions. Within 30 days, aim for a demonstrated pilot in a test environment and a timed restore exercise for the selected backup approach. Agree measurable targets with the team before implementation rather than promising unverified savings or zero downtime.\n\nUseful official links: [session catalog](https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog), [event experience and daily overview](https://www.ibm.com/events/techxchange/experience), [FAQ and event-account guidance](https://www.ibm.com/events/techxchange/faq). The FAQ confirms COMMON sessions are available to valid TechXchange attendees without a separate COMMON registration.\n'

function makeConferenceSourceNotes() {
  const parts: string[] = []
  let cursor = 0
  while (cursor < conferencePlanSourceText.length) {
    let end = Math.min(cursor + 670, conferencePlanSourceText.length)
    if (end < conferencePlanSourceText.length) {
      while (end > cursor && !/\s/.test(conferencePlanSourceText[end]!)) end--
      if (end === cursor) end = Math.min(cursor + 670, conferencePlanSourceText.length)
    }
    const part = conferencePlanSourceText.slice(cursor, end).trim()
    if (part) parts.push(part)
    cursor = end
    while (cursor < conferencePlanSourceText.length && /\s/.test(conferencePlanSourceText[cursor]!))
      cursor++
  }
  return parts.map((part, index) => ({
    body: `Original conference plan (${index + 1}/${parts.length})\n${part}`,
  }))
}

export const conferencePlan = {
  title: 'IBM TechXchange 2026 — personal and Humphrey Products plan',
  timeZone: 'America/New_York',
  startsAt: '2026-10-26T12:00:00-04:00',
  endsAt: '2026-10-29T12:00:00-04:00',
  scheduledSessions: [
    {
      startsAt: '2026-10-26T13:00:00-04:00',
      endsAt: '2026-10-26T14:00:00-04:00',
      title: 'IBM Bob User Group: Part 1 — Meet IBM Bob (MUP-4635)',
      locationName: 'B215, Level 2, Building B',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=MUP-4635',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: false,
    },
    {
      startsAt: '2026-10-26T15:30:00-04:00',
      endsAt: '2026-10-26T16:30:00-04:00',
      title: 'IBM Bob User Group: Part 3 — IBM i Development and Modernization (MUP-4637)',
      locationName: 'B215, Level 2, Building B',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=MUP-4637',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: false,
    },
    {
      startsAt: '2026-10-26T18:00:00-04:00',
      endsAt: '2026-10-26T21:00:00-04:00',
      title: 'Opening night block party (optional) (NETWORK)',
      locationName: 'Sandbox Expo',
      sourceUrl: 'https://www.ibm.com/events/techxchange/experience',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: true,
    },
    {
      startsAt: '2026-10-27T09:00:00-04:00',
      endsAt: '2026-10-27T10:00:00-04:00',
      title: 'Opening general session — Make Your Agents Enterprise Ready (GEN-5572)',
      locationName: 'Hall B4, Building B, GWCC',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1790115059212001fgKJ',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: false,
    },
    {
      startsAt: '2026-10-27T10:30:00-04:00',
      endsAt: '2026-10-27T11:15:00-04:00',
      title: 'Navigating the HA/DR Maze: Make the Right Move (TEC-4380)',
      locationName: 'C212, Level 2, Building C',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4380',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: false,
    },
    {
      startsAt: '2026-10-27T11:30:00-04:00',
      endsAt: '2026-10-27T12:00:00-04:00',
      title: 'Demo: IBM Bob Premium Package for i (DMO-4677)',
      locationName: 'IBM Bob for Infrastructure, Sandbox',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=DMO-4677',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: false,
    },
    {
      startsAt: '2026-10-27T13:30:00-04:00',
      endsAt: '2026-10-27T14:00:00-04:00',
      title: 'Meet the Expert: IBM Bob Self-hosted (MTE-5888)',
      locationName: 'Expert Bar 01, IBM Bob, Sandbox',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=MTE-5888',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: false,
    },
    {
      startsAt: '2026-10-27T14:45:00-04:00',
      endsAt: '2026-10-27T15:30:00-04:00',
      title: 'IBM Bob & Db2 for i (TEC-4512)',
      locationName: 'C208, Level 2, Building C',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4512',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: false,
    },
    {
      startsAt: '2026-10-27T16:00:00-04:00',
      endsAt: '2026-10-27T16:45:00-04:00',
      title: 'An Overview of IBM i Migrate While Active (TEC-4455)',
      locationName: 'C213, Level 2, Building C',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4455',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: false,
    },
    {
      startsAt: '2026-10-28T10:30:00-04:00',
      endsAt: '2026-10-28T11:15:00-04:00',
      title: 'Creating Virtual IBM i Partitions Hosted by IBM i (TEC-4470)',
      locationName: 'C208, Level 2, Building C',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4470',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: false,
    },
    {
      startsAt: '2026-10-28T11:30:00-04:00',
      endsAt: '2026-10-28T12:00:00-04:00',
      title: 'Meet the Expert: Bill Starke — IBM Power (MTE-4977)',
      locationName: 'Workbench 03, Infrastructure, Sandbox',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=MTE-4977',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: false,
    },
    {
      startsAt: '2026-10-28T12:30:00-04:00',
      endsAt: '2026-10-28T13:00:00-04:00',
      title: 'Meet the Expert: Tim Rowe — Bob for IBM i (MTE-5894)',
      locationName: 'Expert Bar 01, IBM Bob, Sandbox',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=MTE-5894',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: false,
    },
    {
      startsAt: '2026-10-28T13:30:00-04:00',
      endsAt: '2026-10-28T14:15:00-04:00',
      title: 'DR Planning Yearly Checkup (TEC-4522)',
      locationName: 'C213, Level 2, Building C',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4522',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: false,
    },
    {
      startsAt: '2026-10-28T14:45:00-04:00',
      endsAt: '2026-10-28T15:30:00-04:00',
      title: 'Optimizing Performance Priorities with Power11 Resource Groups (TEC-1402)',
      locationName: 'C205, Level 2, Building C',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-1402',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: false,
    },
    {
      startsAt: '2026-10-28T16:00:00-04:00',
      endsAt: '2026-10-28T16:20:00-04:00',
      title: 'Rapid Fire Tips for Using IBM i on PowerVS (TLK-4864)',
      locationName: 'Tech Talk 08 / 831, COMMON Hub, Sandbox',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TLK-4864',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: false,
    },
    {
      startsAt: '2026-10-29T09:00:00-04:00',
      endsAt: '2026-10-29T09:45:00-04:00',
      title: 'Deep Dive with IBM Bob Premium Package for i (TEC-4517)',
      locationName: 'C209, Level 2, Building C',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4517',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: false,
    },
    {
      startsAt: '2026-10-29T10:15:00-04:00',
      endsAt: '2026-10-29T11:00:00-04:00',
      title: 'Full-System Resilience for IBM i on PowerVS: Live Demo (TEC-4499)',
      locationName: 'C213, Level 2, Building C',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4499',
      sourceAttribution: 'User-supplied pasted plan; catalog was not refetched.',
      isOptional: false,
    },
  ],
  alternatives: [
    {
      title: 'From Idea to Application with Bob — LAB-4975',
      when: 'Mon 4:15–5:45 PM, Lab 04',
      reason:
        'You prefer a general hands-on Bob lab over the IBM i meetup. It overlaps the meetup; the plan favors the IBM i meetup. The Wed 4:45–6:15 repeat can fit if you want a lab later.',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=LAB-4975',
      scheduled: false,
      kind: 'idea',
    },
    {
      title: 'Air-gapped Bob deployment lab — LAB-3069',
      when: 'Mon 2:15–3:45 PM, Lab 02',
      reason:
        'Deployment implementation is more urgent than the IBM i community discussion. It overlaps the 3:30 meetup. The Thu repeat ends after departure.',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=LAB-3069',
      scheduled: false,
      kind: 'idea',
    },
    {
      title: 'Navigator for i — Administrator’s View — TEC-4459',
      when: 'Wed 4:00–4:45 PM, C207',
      reason: 'Daily on-premises administration is more valuable than the short PowerVS overview.',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4459',
      scheduled: false,
      kind: 'idea',
    },
    {
      title: 'IBM i MCP Server — TEC-4514',
      when: 'Thu 10:15–11:00 AM, C209',
      reason:
        'Agent integration takes priority over the FlashCopy demo. For the stated backup goal, the plan favors FlashCopy.',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1783100663083001QMlT',
      scheduled: false,
      kind: 'idea',
    },
    {
      title: 'Power10/Power11 architecture distinctions — TEC-1403',
      when: 'Thu 9:00–9:45 AM, C205',
      reason:
        'Hardware selection is the immediate decision. It conflicts with the Bob deep dive; discuss hardware with Bill Starke Wednesday if keeping Bob.',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1776127585244001bhH2',
      scheduled: false,
      kind: 'idea',
    },
  ],
  optionalIdeas: [
    {
      title: 'From Idea to Application with Bob — LAB-4975',
      when: 'Mon 4:15–5:45 PM, Lab 04',
      reason: 'Overlaps the selected IBM i meetup; the Wed repeat can fit.',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=LAB-4975',
      scheduled: false,
      kind: 'idea',
    },
    {
      title: 'Air-gapped Bob deployment lab — LAB-3069',
      when: 'Mon 2:15–3:45 PM, Lab 02',
      reason: 'Overlaps the selected 3:30 meetup; the Thu repeat ends after departure.',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=LAB-3069',
      scheduled: false,
      kind: 'idea',
    },
    {
      title: 'Navigator for i — Administrator’s View — TEC-4459',
      when: 'Wed 4:00–4:45 PM, C207',
      reason: 'Alternative to the selected PowerVS overview.',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog?search=TEC-4459',
      scheduled: false,
      kind: 'idea',
    },
    {
      title: 'IBM i MCP Server — TEC-4514',
      when: 'Thu 10:15–11:00 AM, C209',
      reason: 'Overlaps the selected FlashCopy demo.',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1783100663083001QMlT',
      scheduled: false,
      kind: 'idea',
    },
    {
      title: 'Power10/Power11 architecture distinctions — TEC-1403',
      when: 'Thu 9:00–9:45 AM, C205',
      reason: 'Conflicts with the selected Bob deep dive.',
      sourceUrl:
        'https://reg.tools.ibm.com/flow/ibm/techxchange26/sessioncatalog/page/sessioncatalog/session/1776127585244001bhH2',
      scheduled: false,
      kind: 'idea',
    },
    {
      title: 'TechXchange Unplugged',
      when: 'Wed 7:00–10:00 PM, Georgia Aquarium and World of Coca-Cola',
      reason:
        'Optional evening networking from the supplied plan; no formal session URL was supplied.',
      sourceUrl: null,
      scheduled: false,
      kind: 'idea',
    },
  ],
  notes: [
    ...makeConferenceSourceNotes(),
    {
      body: 'Planning goals\n1. An on-premises modernization pilot: document and improve one small IBM i application or process, with a test environment, baseline behavior, validation, and rollback.\n2. A backup-window decision: compare feasible approaches against Humphrey’s maximum acceptable application pause, recovery time (RTO), and acceptable data loss (RPO).\n3. A Power11 and cloud decision note: identify what the current system already provides, what needs configuring or licensing, and whether cloud dev/test or DR adds enough value to justify its ongoing cost.',
    },
    {
      body: 'Questions for expert discussions\nUse the full original plan notes for detailed questions. Priorities: on-premises backups with minimized interruption, IBM Bob for IBM i and self-hosted support, and Power11/cloud fit. Record constraints and verified details; exact Power model, IBM i release/PTFs, storage, and backup tooling are unknown.',
    },
    {
      body: 'Preparation and follow-up\nBefore expert conversations, gather the Power model, IBM i release/PTFs, storage model, backup software and target, current save duration and application pause, data volume and growth, journaling/replication, and latest restore test. Get missing details from the relevant Humphrey owner. After each session, capture one useful idea, prerequisite or limitation, use case, contact, and next action. Within two business days of return, share a one-page pilot and backup comparison; within 30 days aim for a test-environment pilot and timed restore. These dates are goals, not commitments.',
    },
    {
      body: 'Conference source and review boundary\nPrepared October 25, 2026 from user-pasted material said to have been inspected in Safari. Links and times are preserved from that material and were not independently verified. Recommended itinerary only; no session reservations or account favorites are created.',
    },
  ],
  tasks: [
    { title: 'Prepare configuration note for expert conversations', dueDate: '2026-10-26' },
    {
      title:
        'Capture one useful idea, prerequisite or limitation, use case, contact, and next action after each session',
      dueDate: '2026-10-29',
    },
    {
      title: 'Share a one-page recommendation with the relevant Humphrey team',
      dueDate: '2026-11-02',
    },
    {
      title: 'Aim for a demonstrated test-environment pilot and timed restore exercise',
      dueDate: '2026-11-28',
    },
  ],
} as const

export function assertNoScheduledOverlaps() {
  const items = [...conferencePlan.scheduledSessions].sort(
    (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)
  )
  for (let i = 1; i < items.length; i++) {
    if (Date.parse(items[i - 1]!.endsAt) > Date.parse(items[i]!.startsAt))
      throw new Error('Scheduled itinerary contains an overlap')
  }
  return true
}
