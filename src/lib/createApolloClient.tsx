import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import fetch from 'isomorphic-unfetch';
import Cookies from 'js-cookie';
import { NextPageContext } from 'next';

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = Cookies.get('accessToken');
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const createApolloClient = (
  link: string,
  initialState: NormalizedCacheObject = {},
  ctx: NextPageContext
) => {
  const fetchOptions = {
    agent: null,
  };

  // If you are using a https_proxy, add fetchOptions with 'https-proxy-agent' agent instance
  // 'https-proxy-agent' is required here because it's a sever-side only module
  if (typeof window === 'undefined') {
    if (process.env.https_proxy) {
      fetchOptions.agent = new (require('https-proxy-agent'))(
        process.env.https_proxy
      );
    }
  }

  const httpLink = new HttpLink({
    uri: link,
    credentials: 'same-origin',
    fetch,
    fetchOptions,
  });

  return new ApolloClient({
    connectToDevTools: Boolean(ctx),
    ssrMode: Boolean(ctx),
    link: ApolloLink.from([authLink, httpLink]),
    cache: new InMemoryCache().restore(initialState),
  });
};
