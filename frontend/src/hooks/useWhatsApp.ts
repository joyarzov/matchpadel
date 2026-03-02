import { useMemo } from 'react';
import { getMatchWhatsAppLink } from '@/lib/whatsapp';
import type { Match } from '@/types/match.types';

export function useWhatsApp(match: Match | null | undefined) {
  const whatsappLink = useMemo(() => {
    if (!match) return null;

    if (match.whatsappGroupLink) {
      return match.whatsappGroupLink;
    }

    if (match.creator?.phone) {
      return getMatchWhatsAppLink(match);
    }

    return null;
  }, [match]);

  return { whatsappLink };
}
