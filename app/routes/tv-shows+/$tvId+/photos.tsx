import * as React from 'react';
import { Spacer } from '@nextui-org/spacer';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { mergeMeta } from '~/utils';
import { useTranslation } from 'react-i18next';
import { Gallery, Item, type GalleryProps } from 'react-photoswipe-gallery';
import { MimeType } from 'remix-image';

import type { Handle } from '~/types/handle';
import type { loader as tvIdLoader } from '~/routes/tv-shows+/$tvId';
import { i18next } from '~/services/i18n';
import { authenticate } from '~/services/supabase';
import { getImages } from '~/services/tmdb/tmdb.server';
import type { ITvShowDetail } from '~/services/tmdb/tmdb.types';
import TMDB from '~/utils/media';
import { useTypedRouteLoaderData } from '~/utils/react/hooks/useTypedRouteLoaderData';
import { CACHE_CONTROL } from '~/utils/server/http';
import { BreadcrumbItem } from '~/components/elements/Breadcrumb';
import Image from '~/components/elements/Image';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const [, locale] = await Promise.all([
    authenticate(request, undefined, true),
    i18next.getLocale(request),
  ]);

  const { tvId } = params;
  const mid = Number(tvId);
  if (!mid) throw new Response('Not Found', { status: 404 });

  const images = await getImages('tv', mid, locale);
  if (!images) throw new Response('Not Found', { status: 404 });

  return json(
    { images },
    {
      headers: { 'Cache-Control': CACHE_CONTROL.detail },
    },
  );
};

export const meta = mergeMeta<typeof loader, { 'routes/tv-shows+/$tvId': typeof tvIdLoader }>(
  ({ matches, params }) => {
    const tvData = matches.find((match) => match.id === 'routes/tv-shows+/$tvId')?.data;
    if (!tvData) {
      return [
        { title: 'Missing Tv show' },
        { name: 'description', content: `There is no tv show with ID: ${params.tvId}` },
      ];
    }
    const { detail } = tvData;
    const { name } = detail || {};
    return [
      { title: `AnimeNexus - ${name} - Photos` },
      { property: 'og:title', content: `AnimeNexus - ${name} - Photos` },
      {
        property: 'og:url',
        content: `https://anime-nexus-six.vercel.app/tv-shows/${params.tvId}/photos`,
      },
      { property: 'twitter:title', content: `AnimeNexus - ${name} - Photos` },
    ];
  },
);

export const handle: Handle = {
  breadcrumb: ({ match, t }) => (
    <BreadcrumbItem
      to={`/tv-shows/${match.params.tvId}/photos`}
      key={`tv-shows-${match.params.tvId}-photos`}
    >
      {t('photos')}
    </BreadcrumbItem>
  ),
  miniTitle: ({ parentMatch, t }) => ({
    title: parentMatch ? (parentMatch?.data as { detail: ITvShowDetail })?.detail?.name || '' : '',
    subtitle: t('photos'),
    showImage: parentMatch
      ? (parentMatch?.data as { detail: ITvShowDetail })?.detail?.poster_path !== undefined
      : false,
    imageUrl: TMDB?.posterUrl(
      parentMatch
        ? (parentMatch?.data as { detail: ITvShowDetail })?.detail?.poster_path || ''
        : '',
      'w92',
    ),
  }),
};

const uiElements: GalleryProps['uiElements'] = [
  {
    name: 'custom-rotate-button',
    ariaLabel: 'Rotate',
    order: 9,
    isButton: true,
    html: {
      isCustomSVG: true,
      inner:
        '<path d="M13.887 6.078C14.258 6.234 14.5 6.598 14.5 7V8.517C18.332 8.657 21.258 10.055 23.15 12.367 24.519 14.041 25.289 16.13 25.496 18.409A1 1 0 0123.504 18.591C23.327 16.645 22.68 14.952 21.601 13.633 20.156 11.867 17.831 10.653 14.5 10.517V12A1.002 1.002 0 0112.779 12.693L10.304 10.121A1.002 1.002 0 0110.324 8.713L12.8 6.286A1 1 0 0113.887 6.078ZM7.5 16A1.5 1.5 0 006 17.5V24.5A1.5 1.5 0 007.5 26H17.5A1.5 1.5 0 0019 24.5V17.5A1.5 1.5 0 0017.5 16H7.5Z" id="pswp__icn-rotate"/>',
      outlineID: 'pswp__icn-rotate',
    },
    appendTo: 'bar',
    onClick: (_, __, pswpInstance) => {
      const item = pswpInstance.currSlide?.content.element;

      const prevRotateAngle = Number(item?.dataset.rotateAngel) || 0;
      const rotateAngle = prevRotateAngle === 270 ? 0 : prevRotateAngle + 90;

      // add slide rotation
      if (item) {
        item.style.transform = `${item.style.transform?.replace(
          `rotate(-${prevRotateAngle}deg)`,
          '',
        )} rotate(-${rotateAngle}deg)`;
        item.dataset.rotateAngel = String(rotateAngle);
      }
    },
    onInit: (_, pswpInstance) => {
      // remove applied rotation on slide change
      // https://photoswipe.com/events/#slide-content-events
      pswpInstance.on('contentRemove', () => {
        const item = pswpInstance.currSlide?.content.element;
        if (item) {
          item.style.transform = `${item.style.transform?.replace(
            `rotate(-${item.dataset.rotateAngel || 0}deg)`,
            '',
          )}`;
          delete item.dataset.rotateAngel;
        }
      });
    },
  },
];

const TvPhotosPage = () => {
  const { images } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const tvData = useTypedRouteLoaderData('routes/tv-shows+/$tvId');

  return (
    <div className="flex w-full flex-col items-center justify-center px-3 sm:px-0">
      <Spacer y={5} />
      {images?.backdrops && images.backdrops.length > 0 && (
        <>
          <h5 className="flex w-full justify-center">
            <strong>{t('backdrops')}</strong>
          </h5>
          <Spacer y={2.5} />
          <Gallery withCaption withDownloadButton uiElements={uiElements}>
            <div className="grid grid-cols-1 justify-center gap-3 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {images?.backdrops?.map((image) => (
                <Item
                  key={image.file_path}
                  cropped
                  original={TMDB.profileUrl(image?.file_path, 'original')}
                  thumbnail={TMDB.profileUrl(image?.file_path, 'w185')}
                  alt={`Backdrop of ${tvData?.detail?.name} image size ${image.width}x${image.height}`}
                  caption={`Backdrop of ${tvData?.detail?.name} size ${image.width}x${image.height}`}
                  width={image.width}
                  height={image.height}
                >
                  {({ ref, open }) => (
                    <Image
                      src={TMDB.profileUrl(image?.file_path, 'w185')}
                      ref={ref as React.MutableRefObject<HTMLImageElement>}
                      onClick={open}
                      alt={`Backdrop of ${tvData?.detail?.name} image size ${image.width}x${image.height}`}
                      radius="lg"
                      classNames={{
                        img: 'h-auto min-w-[120px] cursor-pointer object-cover 2xs:min-w-[185px]',
                      }}
                      title={tvData?.detail?.name}
                      placeholder="empty"
                      options={{
                        contentType: MimeType.WEBP,
                      }}
                    />
                  )}
                </Item>
              ))}
            </div>
          </Gallery>
          <Spacer y={5} />
        </>
      )}
      {images?.logos && images.logos.length > 0 && (
        <>
          <h5 className="flex w-full justify-center">
            <strong>{t('logos')}</strong>
          </h5>
          <Spacer y={2.5} />
          <Gallery withCaption withDownloadButton uiElements={uiElements}>
            <div className="grid grid-cols-1 justify-center gap-3 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {images?.logos?.map((image) => (
                <Item
                  key={image.file_path}
                  cropped
                  original={TMDB.logoUrl(image?.file_path, 'original')}
                  thumbnail={TMDB.logoUrl(image?.file_path, 'w185')}
                  alt={`Logo of ${tvData?.detail?.name} image size ${image.width}x${image.height}`}
                  caption={`Logo of ${tvData?.detail?.name} size ${image.width}x${image.height}`}
                  width={image.width}
                  height={image.height}
                >
                  {({ ref, open }) => (
                    <Image
                      src={TMDB.logoUrl(image?.file_path, 'w185')}
                      ref={ref as React.MutableRefObject<HTMLImageElement>}
                      onClick={open}
                      alt={`Logo of ${tvData?.detail?.name} image size ${image.width}x${image.height}`}
                      radius="lg"
                      classNames={{
                        img: 'h-auto min-w-[120px] cursor-pointer object-cover 2xs:min-w-[185px]',
                      }}
                      title={tvData?.detail?.name}
                      placeholder="empty"
                      options={{
                        contentType: MimeType.WEBP,
                      }}
                    />
                  )}
                </Item>
              ))}
            </div>
          </Gallery>
          <Spacer y={5} />
        </>
      )}
      {images?.posters && images.posters.length > 0 && (
        <>
          <h5 className="flex w-full justify-center">
            <strong>{t('posters')}</strong>
          </h5>
          <Spacer y={2.5} />
          <Gallery withCaption withDownloadButton uiElements={uiElements}>
            <div className="grid grid-cols-1 justify-center gap-3 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {images?.posters?.map((image) => (
                <Item
                  key={image.file_path}
                  cropped
                  original={TMDB.profileUrl(image?.file_path, 'original')}
                  thumbnail={TMDB.profileUrl(image?.file_path, 'w185')}
                  alt={`Poster of ${tvData?.detail?.name} image size ${image.width}x${image.height}`}
                  caption={`Poster of ${tvData?.detail?.name} size ${image.width}x${image.height}`}
                  width={image.width}
                  height={image.height}
                >
                  {({ ref, open }) => (
                    <Image
                      src={TMDB.profileUrl(image?.file_path, 'w185')}
                      ref={ref as React.MutableRefObject<HTMLImageElement>}
                      onClick={open}
                      alt={`Poster of ${tvData?.detail?.name} image size ${image.width}x${image.height}`}
                      radius="lg"
                      classNames={{
                        img: 'h-auto min-w-[120px] cursor-pointer object-cover 2xs:min-w-[185px]',
                      }}
                      title={tvData?.detail?.name}
                      placeholder="empty"
                      options={{
                        contentType: MimeType.WEBP,
                      }}
                    />
                  )}
                </Item>
              ))}
            </div>
          </Gallery>
        </>
      )}
    </div>
  );
};

export default TvPhotosPage;
