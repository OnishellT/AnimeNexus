import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useLocation, useNavigate } from '@remix-run/react';
import { mergeMeta } from '~/utils';
import { motion, type PanInfo } from 'framer-motion';
import { isMobile } from 'react-device-detect';
import { useTranslation } from 'react-i18next';

import type { Handle } from '~/types/handle';
import { i18next } from '~/services/i18n';
import { authenticate } from '~/services/supabase';
import { getListTvShows } from '~/services/tmdb/tmdb.server';
import { useHydrated } from '~/utils/react/hooks/useHydrated';
import { useTypedRouteLoaderData } from '~/utils/react/hooks/useTypedRouteLoaderData';
import { CACHE_CONTROL } from '~/utils/server/http';
import MediaList from '~/components/media/MediaList';
import { BreadcrumbItem } from '~/components/elements/Breadcrumb';

export const meta = mergeMeta(() => [
  { title: 'AnimeNexus - Airing Today Tv Shows' },
  { name: 'description', content: 'Airing Today Tv Shows' },
  { property: 'og:url', content: 'https://anime-nexus-six.vercel.app/tv-shows/airing-today' },
  { property: 'og:title', content: 'AnimeNexus - Airing Today Tv Shows' },
  { property: 'og:description', content: 'Airing Today Tv Shows' },
  { name: 'twitter:title', content: 'AnimeNexus - Airing Today Tv Shows' },
  { name: 'twitter:description', content: 'Airing Today Tv Shows' },
]);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [, locale] = await Promise.all([
    authenticate(request, undefined, true),
    i18next.getLocale(request),
  ]);

  const url = new URL(request.url);
  let page = Number(url.searchParams.get('page')) || undefined;
  if (page && (page < 1 || page > 1000)) page = 1;

  return json(
    {
      shows: await getListTvShows('airing_today', locale, page),
    },
    {
      headers: {
        'Cache-Control': CACHE_CONTROL.airingToday,
      },
    },
  );
};

export const handle: Handle = {
  breadcrumb: ({ t }) => (
    <BreadcrumbItem to="/tv-shows/airing-today" key="tv-shows-airing-today">
      {t('airing-today-tv-shows')}
    </BreadcrumbItem>
  ),
  miniTitle: ({ t }) => ({
    title: t('airing-today-tv-shows'),
    showImage: false,
  }),
  showListViewChangeButton: true,
};

const ListAiringTodayTvShows = () => {
  const { shows } = useLoaderData<typeof loader>();
  const rootData = useTypedRouteLoaderData('root');
  const location = useLocation();
  const navigate = useNavigate();
  const isHydrated = useHydrated();
  const { t } = useTranslation();

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset?.x > 100) {
      navigate('/tv-shows/popular');
    }
    if (info.offset?.x < -100 && info.offset?.y > -50) {
      navigate('/tv-shows/on-the-air');
    }
  };

  return (
    <motion.div
      key={location.key}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex w-full flex-col items-center justify-center px-3 sm:px-0"
      drag={isMobile && isHydrated ? 'x' : false}
      dragConstraints={isMobile && isHydrated ? { left: 0, right: 0 } : false}
      dragElastic={isMobile && isHydrated ? 0.7 : false}
      onDragEnd={handleDragEnd}
      dragDirectionLock={isMobile && isHydrated}
      draggable={isMobile && isHydrated}
    >
      <MediaList
        currentPage={shows?.page}
        genresMovie={rootData?.genresMovie}
        genresTv={rootData?.genresTv}
        items={shows?.items}
        itemsType="tv"
        listName={t('airing-today-tv-shows')}
        listType="grid"
        showListTypeChangeButton
        totalPages={shows?.totalPages}
      />
    </motion.div>
  );
};

export default ListAiringTodayTvShows;
