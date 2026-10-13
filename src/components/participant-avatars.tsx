import { useTranslation } from "react-i18next";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "cn";

export type ParticipantAvatar = {
  id: string;
  name: string;
  image: string | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ParticipantAvatars({
  participants,
  totalCount = participants.length,
  maxVisible = 4,
  size = "default",
  className,
  showLabel = true,
}: {
  participants: ParticipantAvatar[];
  totalCount?: number;
  maxVisible?: number;
  size?: "default" | "sm" | "lg";
  className?: string;
  showLabel?: boolean;
}) {
  const { t } = useTranslation();
  const visibleParticipants = participants.slice(0, maxVisible);
  const remainingCount = Math.max(totalCount - visibleParticipants.length, 0);

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <AvatarGroup aria-label={t("common.eventParticipants")}>
        {visibleParticipants.map((participant) => (
          <Avatar key={participant.id} size={size}>
            <AvatarImage
              src={participant.image ?? undefined}
              alt={participant.name}
            />
            <AvatarFallback className="text-[10px]">
              {initials(participant.name)}
            </AvatarFallback>
          </Avatar>
        ))}
        {remainingCount > 0 ? (
          <AvatarGroupCount aria-label={t("common.morePeople", { count: remainingCount })}>
            +{remainingCount}
          </AvatarGroupCount>
        ) : null}
      </AvatarGroup>
      {showLabel ? (
        <span className="truncate text-xs text-muted-foreground">
          {t("event.participantsCount", { count: totalCount })}
        </span>
      ) : null}
    </div>
  );
}
