import { gql, useQuery } from '@apollo/client';
import {
  contactsByEntity as CONTACT_BY_ENTITY,
  Contact,
  ContactStatus,
  ContactType,
} from '@admiin-com/ds-graphql';
import { useMemo } from 'react';
import { CSGetSelectedEntityId as GET_SELECTED_ENTITY_ID } from '@admiin-com/ds-graphql';
import { mergeUniqueItems } from '@admiin-com/ds-common';

interface useContactsProps {
  searchName?: string;
  contactType?: ContactType;
}

export const useContacts = ({
  searchName = '',
  contactType = ContactType.NORMAL,
}: useContactsProps) => {
  const { data: selectedEntityIdData } = useQuery(gql(GET_SELECTED_ENTITY_ID));
  const entityId = selectedEntityIdData?.selectedEntityId;

  const handleLoadMore = () => {
    const currentToken = contactsData?.contactsByEntity?.nextToken;

    if (currentToken) {
      fetchMore({
        variables: {
          nextToken: currentToken,
        },
        updateQuery: (prevResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prevResult;
          return {
            ...fetchMoreResult,
            contactsByEntity: {
              ...fetchMoreResult.contactsByEntity,

              items: mergeUniqueItems(
                prevResult.contactsByEntity?.items ?? [],
                fetchMoreResult.contactsByEntity?.items ?? [],
                ['id'] // Assuming 'id' is the unique key
              ),
              nextToken: fetchMoreResult.contactsByEntity.nextToken, // Ensure the new token is updated
            },
          };
        },
      });
    }
  };
  const {
    data: contactsData,
    fetchMore,
    error: searchContactsError,
    loading,
  } = useQuery(gql(CONTACT_BY_ENTITY), {
    variables: {
      entityId,
      filter: {
        searchName: {
          contains: searchName,
        },
        status: { eq: ContactStatus.ACTIVE },
      },
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
  });

  const contacts: Contact[] = useMemo(
    () =>
      contactsData?.contactsByEntity?.items?.filter(
        (contact: Contact) => contact.status !== ContactStatus.ARCHIVED
      ) || [],
    [contactsData]
  );

  const hasNextPage = contactsData?.contactsByEntity?.nextToken != null;
  return {
    contacts,
    error: searchContactsError,
    handleLoadMore, // Use this function to load more items
    loading,
    hasNextPage,
  };
};
