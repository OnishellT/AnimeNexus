import * as React from 'react';
import { DataFunctionArgs, json, LoaderFunction } from '@remix-run/node';
import { useLoaderData, useNavigate, useParams } from '@remix-run/react';
import { Input, Grid, Container, Button, Pagination, useInput } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';

import { getSearchMovies } from '~/services/tmdb/tmdb.server';
import MediaList from '~/src/components/Media/MediaList';
import useMediaQuery from '~/hooks/useMediaQuery';
import i18next from '~/i18n/i18next.server';

type LoaderData = {
  searchResults: Awaited<ReturnType<typeof getSearchMovies>>;
};

export const loader: LoaderFunction = async ({ request, params }: DataFunctionArgs) => {
  const locale = await i18next.getLocale(request);
  const keyword = params?.movieKeyword || '';
  const url = new URL(request.url);
  let page = Number(url.searchParams.get('page')) || undefined;
  if (page && (page < 1 || page > 1000)) page = 1;

  return json<LoaderData>({
    searchResults: await getSearchMovies(keyword, page, locale),
  });
};

const SearchRoute = () => {
  const { searchResults } = useLoaderData<LoaderData>() || {};
  const navigate = useNavigate();
  const { movieKeyword } = useParams();
  const { value, bindings } = useInput(movieKeyword || '');
  const isXs = useMediaQuery(650);
  const { t } = useTranslation();
  const [listName] = React.useState(t('searchResults'));

  const paginationChangeHandler = (page: number) =>
    navigate(`/search/movie/${movieKeyword}?page=${page}`);
  const onClickSearch = () => navigate(`/search/movie/${value}`);
  return (
    <>
      <Grid.Container gap={1} css={{ padding: '30px 10px' }}>
        <Grid>
          <Input
            {...bindings}
            clearable
            bordered
            initialValue={movieKeyword}
            color="primary"
            fullWidth
            helperText={t('searchHelper')}
          />
        </Grid>
        <Grid>
          <Button auto onClick={onClickSearch}>
            {t('search')}
          </Button>
        </Grid>
      </Grid.Container>
      <Container
        fluid
        display="flex"
        justify="center"
        direction="column"
        alignItems="center"
        css={{
          '@xsMax': {
            paddingLeft: 'calc(var(--nextui-space-sm))',
            paddingRight: 'calc(var(--nextui-space-sm))',
          },
        }}
      >
        {searchResults?.items.length > 0 && (
          <MediaList listType="grid" items={searchResults.items} listName={listName} />
        )}
        <Pagination
          total={searchResults.totalPages}
          initialPage={searchResults.page}
          shadow
          onChange={paginationChangeHandler}
          css={{ marginTop: '30px' }}
          {...(isXs && { size: 'xs' })}
        />
      </Container>
    </>
  );
};

export default SearchRoute;
