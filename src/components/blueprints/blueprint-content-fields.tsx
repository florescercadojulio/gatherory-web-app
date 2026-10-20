import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { BlueprintDraftContent } from '@/contracts/blueprint-authoring.contracts'
import { BLUEPRINT_LIMITS } from '@/contracts/blueprint-install.contracts'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import {
  dependentsForChild,
  makeStableKey,
  reorder,
  targetForValue,
  targetValue,
} from './blueprint-authoring.utils'

type Child = BlueprintDraftContent['children'][number]
type Idea = BlueprintDraftContent['ideas'][number]
type Instruction = BlueprintDraftContent['instructions'][number]
type Target = { value: string; label: string }

export function ActivityFields({
  children,
  ideas,
  instructions,
  todos,
  onChildrenChange,
}: {
  children: BlueprintDraftContent['children']
  ideas: BlueprintDraftContent['ideas']
  instructions: BlueprintDraftContent['instructions']
  todos: BlueprintDraftContent['todos']
  onChildrenChange: (children: BlueprintDraftContent['children']) => void
}) {
  const { t } = useTranslation()
  return (
    <section className="space-y-4" aria-labelledby="blueprint-activities">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
        <div>
          <h2 id="blueprint-activities" className="text-xl font-semibold">
            {t('blueprints.activities')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('blueprints.activitiesHelp')}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={children.length >= BLUEPRINT_LIMITS.children}
          onClick={() =>
            onChildrenChange([
              ...children,
              {
                key: makeStableKey(
                  'activity',
                  '',
                  children.map((item) => item.key)
                ),
                title: '',
                purpose: 'planning_scouting',
                category: 'other',
              },
            ])
          }
        >
          <Plus />
          {t('blueprints.addActivity')}
        </Button>
      </header>
      {children.map((child, index) => {
        const dependency = dependentsForChild(
          {
            name: '',
            description: '',
            experienceType: 'custom',
            children,
            ideas,
            instructions,
            todos,
          },
          child.key
        )
        const dependencyCount =
          dependency.ideas.length + dependency.instructions.length + dependency.todos.length
        return (
          <fieldset
            key={child.key}
            className="grid gap-4 border-b pb-5 sm:grid-cols-2"
            aria-label={`${t('blueprints.activities')} ${index + 1}`}
          >
            <div className="flex items-center justify-between gap-2 sm:col-span-2">
              <span className="text-sm font-medium">
                {t('blueprints.activities')} {index + 1}
              </span>
              <div className="flex gap-1">
                <MoveButtons
                  index={index}
                  length={children.length}
                  onMove={(direction) => onChildrenChange(reorder(children, index, direction))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('blueprints.remove')}
                  disabled={dependencyCount > 0}
                  title={
                    dependencyCount
                      ? t('blueprints.activityDependencyCount', { count: dependencyCount })
                      : undefined
                  }
                  onClick={() =>
                    onChildrenChange(children.filter((_, itemIndex) => itemIndex !== index))
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            {dependencyCount > 0 ? (
              <p className="text-sm text-amber-700 dark:text-amber-400 sm:col-span-2">
                {t('blueprints.activityDependencyCount', { count: dependencyCount })}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor={`child-${child.key}-title`}>{t('blueprints.activityName')}</Label>
              <Input
                id={`child-${child.key}-title`}
                value={child.title}
                onChange={(event) =>
                  onChildrenChange(
                    children.map((item, i) =>
                      i === index ? { ...item, title: event.target.value } : item
                    )
                  )
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`child-${child.key}-purpose`}>{t('blueprints.purpose')}</Label>
                <NativeSelect
                  id={`child-${child.key}-purpose`}
                  value={child.purpose}
                  onChange={(event) =>
                    onChildrenChange(
                      children.map((item, i) =>
                        i === index
                          ? { ...item, purpose: event.target.value as Child['purpose'] }
                          : item
                      )
                    )
                  }
                >
                  <option value="planning_scouting">
                    {t('blueprints.purposes.planning_scouting')}
                  </option>
                  <option value="part_of_event">{t('blueprints.purposes.part_of_event')}</option>
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`child-${child.key}-category`}>{t('blueprints.category')}</Label>
                <NativeSelect
                  id={`child-${child.key}-category`}
                  value={child.category}
                  onChange={(event) =>
                    onChildrenChange(
                      children.map((item, i) =>
                        i === index
                          ? { ...item, category: event.target.value as Child['category'] }
                          : item
                      )
                    )
                  }
                >
                  {(
                    [
                      'venue',
                      'food_tasting',
                      'photography',
                      'honeymoon',
                      'attire_fitting',
                      'wedding_shower',
                      'bachelor_bachelorette',
                      'rehearsal',
                      'ceremony',
                      'reception',
                      'other',
                    ] as const
                  ).map((category) => (
                    <option key={category} value={category}>
                      {t(`blueprints.childCategories.${category}`)}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox
                id={`child-${child.key}-schedule`}
                checked={Boolean(child.scheduleProposal)}
                onCheckedChange={(checked) =>
                  onChildrenChange(
                    children.map((item, i) =>
                      i !== index
                        ? item
                        : checked
                          ? {
                              ...item,
                              scheduleProposal: {
                                anchor: 'main_start',
                                dayOffset: 0,
                                localTime: '09:00',
                              },
                            }
                          : withoutSchedule(item)
                    )
                  )
                }
              />
              <Label htmlFor={`child-${child.key}-schedule`}>{t('blueprints.schedule')}</Label>
            </div>
            {child.scheduleProposal ? (
              <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`child-${child.key}-offset`}>{t('blueprints.dayOffset')}</Label>
                  <Input
                    id={`child-${child.key}-offset`}
                    type="number"
                    min={-365}
                    max={3650}
                    value={child.scheduleProposal.dayOffset}
                    onChange={(event) =>
                      onChildrenChange(
                        children.map((item, i) =>
                          i === index && item.scheduleProposal
                            ? {
                                ...item,
                                scheduleProposal: {
                                  ...item.scheduleProposal,
                                  dayOffset: Number(event.target.value),
                                },
                              }
                            : item
                        )
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`child-${child.key}-time`}>{t('blueprints.localTime')}</Label>
                  <Input
                    id={`child-${child.key}-time`}
                    type="time"
                    value={child.scheduleProposal.localTime}
                    onChange={(event) =>
                      onChildrenChange(
                        children.map((item, i) =>
                          i === index && item.scheduleProposal
                            ? {
                                ...item,
                                scheduleProposal: {
                                  ...item.scheduleProposal,
                                  localTime: event.target.value,
                                },
                              }
                            : item
                        )
                      )
                    }
                  />
                </div>
              </div>
            ) : null}
          </fieldset>
        )
      })}
    </section>
  )
}

export function IdeaFields({
  ideas,
  children,
  onIdeasChange,
}: {
  ideas: BlueprintDraftContent['ideas']
  children: BlueprintDraftContent['children']
  onIdeasChange: (ideas: BlueprintDraftContent['ideas']) => void
}) {
  const { t } = useTranslation()
  const targets = eventTargets(children, t('blueprints.mainEvent'))
  return (
    <section className="space-y-4" aria-labelledby="blueprint-ideas">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
        <div>
          <h2 id="blueprint-ideas" className="text-xl font-semibold">
            {t('blueprints.ideas')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('blueprints.ideasHelp')}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={ideas.length >= BLUEPRINT_LIMITS.ideas}
          onClick={() =>
            onIdeasChange([
              ...ideas,
              {
                key: makeStableKey(
                  'idea',
                  '',
                  ideas.map((item) => item.key)
                ),
                title: '',
                category: 'other',
                target: { kind: 'main' },
                configuration: { version: 1 },
              },
            ])
          }
        >
          <Plus />
          {t('blueprints.addIdea')}
        </Button>
      </header>
      {ideas.map((idea, index) => (
        <fieldset
          key={idea.key}
          className="grid gap-4 border-b pb-5 sm:grid-cols-2"
          aria-label={`${t('blueprints.ideas')} ${index + 1}`}
        >
          <div className="flex items-center justify-between gap-2 sm:col-span-2">
            <span className="text-sm font-medium">
              {t('blueprints.ideas')} {index + 1}
            </span>
            <div className="flex gap-1">
              <MoveButtons
                index={index}
                length={ideas.length}
                onMove={(direction) => onIdeasChange(reorder(ideas, index, direction))}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t('blueprints.remove')}
                onClick={() => onIdeasChange(ideas.filter((_, itemIndex) => itemIndex !== index))}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <TextEntry
            id={`idea-${idea.key}-title`}
            label={t('blueprints.ideaTitle')}
            value={idea.title}
            onChange={(title) =>
              onIdeasChange(ideas.map((item, i) => (i === index ? { ...item, title } : item)))
            }
          />
          <div className="space-y-2">
            <Label htmlFor={`idea-${idea.key}-category`}>{t('blueprints.category')}</Label>
            <NativeSelect
              id={`idea-${idea.key}-category`}
              value={idea.category}
              onChange={(event) =>
                onIdeasChange(
                  ideas.map((item, i) =>
                    i === index
                      ? { ...item, category: event.target.value as Idea['category'] }
                      : item
                  )
                )
              }
            >
              {(
                [
                  'event',
                  'registry',
                  'link',
                  'venue',
                  'attire',
                  'flowers',
                  'food',
                  'photography',
                  'decor',
                  'invitations',
                  'honeymoon',
                  'other',
                ] as const
              ).map((category) => (
                <option key={category} value={category}>
                  {t(`blueprints.ideaCategories.${category}`)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`idea-${idea.key}-note`}>{t('blueprints.note')}</Label>
            <Textarea
              id={`idea-${idea.key}-note`}
              placeholder={t('blueprints.notePlaceholder')}
              value={idea.notes ?? ''}
              onChange={(event) =>
                onIdeasChange(
                  ideas.map((item, i) =>
                    i === index ? { ...item, notes: event.target.value || undefined } : item
                  )
                )
              }
            />
          </div>
          <TargetSelect
            id={`idea-${idea.key}-target`}
            value={targetValue(idea.target)}
            label={t('blueprints.targetEvent')}
            targets={targets}
            onChange={(value) =>
              onIdeasChange(
                ideas.map((item, i) =>
                  i === index ? { ...item, target: targetForValue(value) } : item
                )
              )
            }
          />
        </fieldset>
      ))}
    </section>
  )
}

export function InstructionFields({
  instructions,
  children,
  onInstructionsChange,
}: {
  instructions: BlueprintDraftContent['instructions']
  children: BlueprintDraftContent['children']
  onInstructionsChange: (instructions: BlueprintDraftContent['instructions']) => void
}) {
  const { t } = useTranslation()
  const targets = eventTargets(children, t('blueprints.mainEvent'))
  return (
    <section className="space-y-4" aria-labelledby="blueprint-instructions">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
        <div>
          <h2 id="blueprint-instructions" className="text-xl font-semibold">
            {t('blueprints.instructions')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('blueprints.instructionsHelp')}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={instructions.length >= BLUEPRINT_LIMITS.instructionSections}
          onClick={() =>
            onInstructionsChange([
              ...instructions,
              {
                key: makeStableKey(
                  'instruction',
                  '',
                  instructions.map((item) => item.key)
                ),
                title: '',
                body: '',
                audience: 'planning_only',
                target: { kind: 'main' },
              },
            ])
          }
        >
          <Plus />
          {t('blueprints.addInstruction')}
        </Button>
      </header>
      {instructions.map((instruction, index) => (
        <fieldset
          key={instruction.key}
          className="grid gap-4 border-b pb-5 sm:grid-cols-2"
          aria-label={`${t('blueprints.instructions')} ${index + 1}`}
        >
          <div className="flex items-center justify-between gap-2 sm:col-span-2">
            <span className="text-sm font-medium">
              {t('blueprints.instructions')} {index + 1}
            </span>
            <div className="flex gap-1">
              <MoveButtons
                index={index}
                length={instructions.length}
                onMove={(direction) =>
                  onInstructionsChange(reorder(instructions, index, direction))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t('blueprints.remove')}
                onClick={() =>
                  onInstructionsChange(instructions.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <TextEntry
            id={`instruction-${instruction.key}-title`}
            label={t('blueprints.instructionTitle')}
            value={instruction.title}
            onChange={(title) =>
              onInstructionsChange(
                instructions.map((item, i) => (i === index ? { ...item, title } : item))
              )
            }
          />
          <div className="space-y-2">
            <Label htmlFor={`instruction-${instruction.key}-audience`}>
              {t('blueprints.audience')}
            </Label>
            <NativeSelect
              id={`instruction-${instruction.key}-audience`}
              value={instruction.audience}
              onChange={(event) =>
                onInstructionsChange(
                  instructions.map((item, i) =>
                    i === index
                      ? { ...item, audience: event.target.value as Instruction['audience'] }
                      : item
                  )
                )
              }
            >
              <option value="planning_only">{t('blueprints.audiences.planning_only')}</option>
              <option value="event_participants">
                {t('blueprints.audiences.event_participants')}
              </option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`instruction-${instruction.key}-body`}>
              {t('blueprints.instructionBody')}
            </Label>
            <Textarea
              id={`instruction-${instruction.key}-body`}
              value={instruction.body}
              onChange={(event) =>
                onInstructionsChange(
                  instructions.map((item, i) =>
                    i === index ? { ...item, body: event.target.value } : item
                  )
                )
              }
            />
          </div>
          <TargetSelect
            id={`instruction-${instruction.key}-target`}
            value={targetValue(instruction.target)}
            label={t('blueprints.targetEvent')}
            targets={targets}
            onChange={(value) =>
              onInstructionsChange(
                instructions.map((item, i) =>
                  i === index ? { ...item, target: targetForValue(value) } : item
                )
              )
            }
          />
        </fieldset>
      ))}
    </section>
  )
}

function eventTargets(children: BlueprintDraftContent['children'], mainLabel: string): Target[] {
  return [
    { value: 'main', label: mainLabel },
    ...children.map((child) => ({ value: child.key, label: child.title || child.key })),
  ]
}

function withoutSchedule(child: Child): Child {
  const { scheduleProposal: _schedule, ...rest } = child
  return rest
}

function MoveButtons({
  index,
  length,
  onMove,
}: {
  index: number
  length: number
  onMove: (direction: -1 | 1) => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('blueprints.moveUp')}
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('blueprints.moveDown')}
        disabled={index === length - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown />
      </Button>
    </>
  )
}

function TargetSelect({
  id,
  value,
  label,
  targets,
  onChange,
}: {
  id: string
  value: string
  label: string
  targets: Target[]
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {targets.map((target) => (
          <option key={target.value} value={target.value}>
            {target.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  )
}

function TextEntry({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}
