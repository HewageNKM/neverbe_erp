import {algoliasearch} from "algoliasearch";

export const getAlgoliaClient = () => {
    return algoliasearch(import.meta.env.VITE_ALGOLIA_APP_ID, import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY);
};