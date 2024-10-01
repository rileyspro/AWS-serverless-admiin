/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onUpdateBeneficialOwner = /* GraphQL */ `
  subscription OnUpdateBeneficialOwner(
    $beneficialOwnerId: ID!
    $entityId: ID!
  ) {
    onUpdateBeneficialOwner(
      beneficialOwnerId: $beneficialOwnerId
      entityId: $entityId
    ) {
      id
      firstName
      lastName
      name
      providerEntityId
      verificationStatus
      verificationAttempt
      createdBy
      createdAt
      updatedAt
    }
  }
`;
export const onCreateConversation = /* GraphQL */ `
  subscription OnCreateConversation(
    $filter: ModelSubscriptionConversationFilterInput
  ) {
    onCreateConversation(filter: $filter) {
      title
      image {
        alt
        identityId
        key
        level
        type
      }
      country
      messages {
        items {
          conversationId
          text
          attachments {
            identityId
            key
            level
            type
          }
          users
          receiver
          sender
          createdBy
          readBy
          createdAt
          updatedAt
          id
          conversationMessagesId
        }
        nextToken
      }
      userConversations {
        items {
          conversationId
          conversation {
            title
            image {
              alt
              identityId
              key
              level
              type
            }
            country
            messages {
              items {
                conversationId
                text
                attachments {
                  identityId
                  key
                  level
                  type
                }
                users
                receiver
                sender
                createdBy
                readBy
                createdAt
                updatedAt
                id
                conversationMessagesId
              }
              nextToken
            }
            userConversations {
              items {
                conversationId
                conversation {
                  title
                  country
                  users
                  readBy
                  createdBy
                  createdAt
                  updatedAt
                  id
                }
                userId
                user {
                  id
                  identityId
                  referralCode
                  referredBy
                  email
                  about
                  firstName
                  firmId
                  lastName
                  phone
                  blocked
                  blockedBy
                  country
                  interests
                  locale
                  onboardingStatus
                  onboardingEntity
                  selectedSignatureKey
                  userType
                  rating
                  reportReasons
                  paymentUserId
                  providerWalletId
                  providerNppCrn
                  ipAddress
                  createdAt
                  updatedAt
                  owner
                  loyaltyStatus
                  nextLoyaltyStatus
                  nextLoyaltyStatusPoint
                  statusPoint
                  pointsTotal
                  pointsBalance
                  invitedTo
                }
                users
                createdAt
                updatedAt
                id
                conversationUserConversationsId
              }
              nextToken
            }
            users
            readBy
            createdBy
            createdAt
            updatedAt
            id
          }
          userId
          user {
            id
            identityId
            referralCode
            referredBy
            email
            about
            firstName
            firmId
            lastName
            phone
            blocked
            blockedBy
            country
            profileImg {
              alt
              identityId
              key
              level
              type
            }
            interests
            locale
            onboardingStatus
            onboardingEntity
            selectedSignatureKey
            signatures {
              items {
                id
                userId
                key
                createdAt
                updatedAt
              }
              nextToken
            }
            userType
            rating
            reportReasons
            notificationPreferences {
              email
              push
              sms
            }
            paymentUserId
            providerWalletId
            providerNppCrn
            ipAddress
            createdAt
            updatedAt
            owner
            loyaltyStatus
            nextLoyaltyStatus
            nextLoyaltyStatusPoint
            statusPoint
            pointsTotal
            pointsBalance
            invitedTo
          }
          users
          createdAt
          updatedAt
          id
          conversationUserConversationsId
        }
        nextToken
      }
      users
      readBy
      createdBy
      createdAt
      updatedAt
      id
    }
  }
`;
export const onUpdateEntity = /* GraphQL */ `
  subscription OnUpdateEntity($entityId: ID!) {
    onUpdateEntity(entityId: $entityId) {
      id
      type
      taxNumber
      companyNumber
      billerCode
      name
      legalName
      searchName
      address {
        addressId
        placeId
        contactName
        contactNumber
        address1
        unitNumber
        streetNumber
        streetName
        streetType
        city
        country
        countryCode
        state
        stateCode
        postalCode
      }
      logo {
        alt
        identityId
        key
        level
        type
      }
      entityBeneficialOwners {
        items {
          entityId
          beneficialOwnerId
          beneficialOwner {
            id
            firstName
            lastName
            name
            providerEntityId
            verificationStatus
            verificationAttempt
            createdBy
            createdAt
            updatedAt
          }
          createdAt
          updatedAt
          owner
        }
        nextToken
      }
      entityUsers {
        items {
          id
          entityId
          userId
          invitedEmail
          referredBy
          invitedEntityId
          firmEntityId
          firstName
          lastName
          role
          paymentsEnabled
          entitySearchName
          entity {
            id
            type
            taxNumber
            companyNumber
            billerCode
            name
            legalName
            searchName
            address {
              addressId
              placeId
              contactName
              contactNumber
              address1
              unitNumber
              streetNumber
              streetName
              streetType
              city
              country
              countryCode
              state
              stateCode
              postalCode
            }
            logo {
              alt
              identityId
              key
              level
              type
            }
            entityBeneficialOwners {
              items {
                entityId
                beneficialOwnerId
                beneficialOwner {
                  id
                  firstName
                  lastName
                  name
                  providerEntityId
                  verificationStatus
                  verificationAttempt
                  createdBy
                  createdAt
                  updatedAt
                }
                createdAt
                updatedAt
                owner
              }
              nextToken
            }
            entityUsers {
              items {
                id
                entityId
                userId
                invitedEmail
                referredBy
                invitedEntityId
                firmEntityId
                firstName
                lastName
                role
                paymentsEnabled
                entitySearchName
                entity {
                  id
                  type
                  taxNumber
                  companyNumber
                  billerCode
                  name
                  legalName
                  searchName
                  gstRegistered
                  providerEntityId
                  providerCompanyId
                  providerBillUserCompanyId
                  providerBankAccountId
                  providerDigitalWalletId
                  providerBpayCrn
                  paymentMethodId
                  paymentUserId
                  disbursementMethodId
                  ubosCreated
                  numUbosCreated
                  subCategory
                  clientsStatus
                  ocrEmail
                  verificationStatus
                  createdAt
                  updatedAt
                  owner
                  referredBy
                }
                searchName
                createdBy
                createdAt
                updatedAt
                status
              }
              nextToken
            }
            gstRegistered
            providerEntityId
            providerCompanyId
            providerBillUserCompanyId
            providerBankAccountId
            providerDigitalWalletId
            providerBpayCrn
            contact {
              firstName
              lastName
              email
              phone
              role
            }
            paymentMethods {
              items {
                id
                paymentMethodType
                type
                fullName
                number
                expMonth
                expYear
                accountName
                bankName
                accountNumber
                routingNumber
                holderType
                accountType
                status
                accountDirection
                expiresAt
                createdAt
                updatedAt
              }
              nextToken
            }
            paymentMethodId
            paymentUserId
            disbursementMethodId
            receivingAccounts {
              items {
                id
                paymentMethodType
                type
                fullName
                number
                expMonth
                expYear
                accountName
                bankName
                accountNumber
                routingNumber
                holderType
                accountType
                status
                accountDirection
                expiresAt
                createdAt
                updatedAt
              }
              nextToken
            }
            ubosCreated
            numUbosCreated
            subCategory
            clientsStatus
            ocrEmail
            verificationStatus
            createdAt
            updatedAt
            owner
            referredBy
          }
          searchName
          createdBy
          createdAt
          updatedAt
          status
        }
        nextToken
      }
      gstRegistered
      providerEntityId
      providerCompanyId
      providerBillUserCompanyId
      providerBankAccountId
      providerDigitalWalletId
      providerBpayCrn
      contact {
        firstName
        lastName
        email
        phone
        role
      }
      paymentMethods {
        items {
          id
          paymentMethodType
          type
          fullName
          number
          expMonth
          expYear
          accountName
          bankName
          accountNumber
          routingNumber
          holderType
          accountType
          status
          accountDirection
          expiresAt
          createdAt
          updatedAt
        }
        nextToken
      }
      paymentMethodId
      paymentUserId
      disbursementMethodId
      receivingAccounts {
        items {
          id
          paymentMethodType
          type
          fullName
          number
          expMonth
          expYear
          accountName
          bankName
          accountNumber
          routingNumber
          holderType
          accountType
          status
          accountDirection
          expiresAt
          createdAt
          updatedAt
        }
        nextToken
      }
      ubosCreated
      numUbosCreated
      subCategory
      clientsStatus
      ocrEmail
      verificationStatus
      createdAt
      updatedAt
      owner
      referredBy
    }
  }
`;
export const onCreateMessageForConversation = /* GraphQL */ `
  subscription OnCreateMessageForConversation($conversationId: ID!) {
    onCreateMessageForConversation(conversationId: $conversationId) {
      conversationId
      text
      attachments {
        identityId
        key
        level
        type
      }
      users
      receiver
      sender
      createdBy
      readBy
      createdAt
      updatedAt
      id
      conversationMessagesId
    }
  }
`;
export const onCreateNotification = /* GraphQL */ `
  subscription OnCreateNotification {
    onCreateNotification {
      id
      title
      message
      status
      createdAt
      updatedAt
      type
      owner
    }
  }
`;
export const onCreateUserConversationForUser = /* GraphQL */ `
  subscription OnCreateUserConversationForUser($userId: ID!) {
    onCreateUserConversationForUser(userId: $userId) {
      conversationId
      conversation {
        title
        image {
          alt
          identityId
          key
          level
          type
        }
        country
        messages {
          items {
            conversationId
            text
            attachments {
              identityId
              key
              level
              type
            }
            users
            receiver
            sender
            createdBy
            readBy
            createdAt
            updatedAt
            id
            conversationMessagesId
          }
          nextToken
        }
        userConversations {
          items {
            conversationId
            conversation {
              title
              image {
                alt
                identityId
                key
                level
                type
              }
              country
              messages {
                items {
                  conversationId
                  text
                  users
                  receiver
                  sender
                  createdBy
                  readBy
                  createdAt
                  updatedAt
                  id
                  conversationMessagesId
                }
                nextToken
              }
              userConversations {
                items {
                  conversationId
                  userId
                  users
                  createdAt
                  updatedAt
                  id
                  conversationUserConversationsId
                }
                nextToken
              }
              users
              readBy
              createdBy
              createdAt
              updatedAt
              id
            }
            userId
            user {
              id
              identityId
              referralCode
              referredBy
              email
              about
              firstName
              firmId
              lastName
              phone
              blocked
              blockedBy
              country
              profileImg {
                alt
                identityId
                key
                level
                type
              }
              interests
              locale
              onboardingStatus
              onboardingEntity
              selectedSignatureKey
              signatures {
                items {
                  id
                  userId
                  key
                  createdAt
                  updatedAt
                }
                nextToken
              }
              userType
              rating
              reportReasons
              notificationPreferences {
                email
                push
                sms
              }
              paymentUserId
              providerWalletId
              providerNppCrn
              ipAddress
              createdAt
              updatedAt
              owner
              loyaltyStatus
              nextLoyaltyStatus
              nextLoyaltyStatusPoint
              statusPoint
              pointsTotal
              pointsBalance
              invitedTo
            }
            users
            createdAt
            updatedAt
            id
            conversationUserConversationsId
          }
          nextToken
        }
        users
        readBy
        createdBy
        createdAt
        updatedAt
        id
      }
      userId
      user {
        id
        identityId
        referralCode
        referredBy
        email
        about
        firstName
        firmId
        lastName
        phone
        blocked
        blockedBy
        country
        profileImg {
          alt
          identityId
          key
          level
          type
        }
        interests
        locale
        onboardingStatus
        onboardingEntity
        selectedSignatureKey
        signatures {
          items {
            id
            userId
            key
            createdAt
            updatedAt
          }
          nextToken
        }
        userType
        rating
        reportReasons
        notificationPreferences {
          email
          push
          sms
        }
        paymentUserId
        providerWalletId
        providerNppCrn
        ipAddress
        createdAt
        updatedAt
        owner
        loyaltyStatus
        nextLoyaltyStatus
        nextLoyaltyStatusPoint
        statusPoint
        pointsTotal
        pointsBalance
        invitedTo
      }
      users
      createdAt
      updatedAt
      id
      conversationUserConversationsId
    }
  }
`;
export const onCreateMessageForSenderUser = /* GraphQL */ `
  subscription OnCreateMessageForSenderUser($sender: String!) {
    onCreateMessageForSenderUser(sender: $sender) {
      conversationId
      text
      attachments {
        identityId
        key
        level
        type
      }
      users
      receiver
      sender
      createdBy
      readBy
      createdAt
      updatedAt
      id
      conversationMessagesId
    }
  }
`;
export const onCreateMessageForReceiverUser = /* GraphQL */ `
  subscription OnCreateMessageForReceiverUser($receiver: String!) {
    onCreateMessageForReceiverUser(receiver: $receiver) {
      conversationId
      text
      attachments {
        identityId
        key
        level
        type
      }
      users
      receiver
      sender
      createdBy
      readBy
      createdAt
      updatedAt
      id
      conversationMessagesId
    }
  }
`;
export const onUpdateConversation = /* GraphQL */ `
  subscription OnUpdateConversation(
    $filter: ModelSubscriptionConversationFilterInput
  ) {
    onUpdateConversation(filter: $filter) {
      title
      image {
        alt
        identityId
        key
        level
        type
      }
      country
      messages {
        items {
          conversationId
          text
          attachments {
            identityId
            key
            level
            type
          }
          users
          receiver
          sender
          createdBy
          readBy
          createdAt
          updatedAt
          id
          conversationMessagesId
        }
        nextToken
      }
      userConversations {
        items {
          conversationId
          conversation {
            title
            image {
              alt
              identityId
              key
              level
              type
            }
            country
            messages {
              items {
                conversationId
                text
                attachments {
                  identityId
                  key
                  level
                  type
                }
                users
                receiver
                sender
                createdBy
                readBy
                createdAt
                updatedAt
                id
                conversationMessagesId
              }
              nextToken
            }
            userConversations {
              items {
                conversationId
                conversation {
                  title
                  country
                  users
                  readBy
                  createdBy
                  createdAt
                  updatedAt
                  id
                }
                userId
                user {
                  id
                  identityId
                  referralCode
                  referredBy
                  email
                  about
                  firstName
                  firmId
                  lastName
                  phone
                  blocked
                  blockedBy
                  country
                  interests
                  locale
                  onboardingStatus
                  onboardingEntity
                  selectedSignatureKey
                  userType
                  rating
                  reportReasons
                  paymentUserId
                  providerWalletId
                  providerNppCrn
                  ipAddress
                  createdAt
                  updatedAt
                  owner
                  loyaltyStatus
                  nextLoyaltyStatus
                  nextLoyaltyStatusPoint
                  statusPoint
                  pointsTotal
                  pointsBalance
                  invitedTo
                }
                users
                createdAt
                updatedAt
                id
                conversationUserConversationsId
              }
              nextToken
            }
            users
            readBy
            createdBy
            createdAt
            updatedAt
            id
          }
          userId
          user {
            id
            identityId
            referralCode
            referredBy
            email
            about
            firstName
            firmId
            lastName
            phone
            blocked
            blockedBy
            country
            profileImg {
              alt
              identityId
              key
              level
              type
            }
            interests
            locale
            onboardingStatus
            onboardingEntity
            selectedSignatureKey
            signatures {
              items {
                id
                userId
                key
                createdAt
                updatedAt
              }
              nextToken
            }
            userType
            rating
            reportReasons
            notificationPreferences {
              email
              push
              sms
            }
            paymentUserId
            providerWalletId
            providerNppCrn
            ipAddress
            createdAt
            updatedAt
            owner
            loyaltyStatus
            nextLoyaltyStatus
            nextLoyaltyStatusPoint
            statusPoint
            pointsTotal
            pointsBalance
            invitedTo
          }
          users
          createdAt
          updatedAt
          id
          conversationUserConversationsId
        }
        nextToken
      }
      users
      readBy
      createdBy
      createdAt
      updatedAt
      id
    }
  }
`;
export const onDeleteConversation = /* GraphQL */ `
  subscription OnDeleteConversation(
    $filter: ModelSubscriptionConversationFilterInput
  ) {
    onDeleteConversation(filter: $filter) {
      title
      image {
        alt
        identityId
        key
        level
        type
      }
      country
      messages {
        items {
          conversationId
          text
          attachments {
            identityId
            key
            level
            type
          }
          users
          receiver
          sender
          createdBy
          readBy
          createdAt
          updatedAt
          id
          conversationMessagesId
        }
        nextToken
      }
      userConversations {
        items {
          conversationId
          conversation {
            title
            image {
              alt
              identityId
              key
              level
              type
            }
            country
            messages {
              items {
                conversationId
                text
                attachments {
                  identityId
                  key
                  level
                  type
                }
                users
                receiver
                sender
                createdBy
                readBy
                createdAt
                updatedAt
                id
                conversationMessagesId
              }
              nextToken
            }
            userConversations {
              items {
                conversationId
                conversation {
                  title
                  country
                  users
                  readBy
                  createdBy
                  createdAt
                  updatedAt
                  id
                }
                userId
                user {
                  id
                  identityId
                  referralCode
                  referredBy
                  email
                  about
                  firstName
                  firmId
                  lastName
                  phone
                  blocked
                  blockedBy
                  country
                  interests
                  locale
                  onboardingStatus
                  onboardingEntity
                  selectedSignatureKey
                  userType
                  rating
                  reportReasons
                  paymentUserId
                  providerWalletId
                  providerNppCrn
                  ipAddress
                  createdAt
                  updatedAt
                  owner
                  loyaltyStatus
                  nextLoyaltyStatus
                  nextLoyaltyStatusPoint
                  statusPoint
                  pointsTotal
                  pointsBalance
                  invitedTo
                }
                users
                createdAt
                updatedAt
                id
                conversationUserConversationsId
              }
              nextToken
            }
            users
            readBy
            createdBy
            createdAt
            updatedAt
            id
          }
          userId
          user {
            id
            identityId
            referralCode
            referredBy
            email
            about
            firstName
            firmId
            lastName
            phone
            blocked
            blockedBy
            country
            profileImg {
              alt
              identityId
              key
              level
              type
            }
            interests
            locale
            onboardingStatus
            onboardingEntity
            selectedSignatureKey
            signatures {
              items {
                id
                userId
                key
                createdAt
                updatedAt
              }
              nextToken
            }
            userType
            rating
            reportReasons
            notificationPreferences {
              email
              push
              sms
            }
            paymentUserId
            providerWalletId
            providerNppCrn
            ipAddress
            createdAt
            updatedAt
            owner
            loyaltyStatus
            nextLoyaltyStatus
            nextLoyaltyStatusPoint
            statusPoint
            pointsTotal
            pointsBalance
            invitedTo
          }
          users
          createdAt
          updatedAt
          id
          conversationUserConversationsId
        }
        nextToken
      }
      users
      readBy
      createdBy
      createdAt
      updatedAt
      id
    }
  }
`;
export const onCreateUserConversation = /* GraphQL */ `
  subscription OnCreateUserConversation(
    $filter: ModelSubscriptionUserConversationFilterInput
  ) {
    onCreateUserConversation(filter: $filter) {
      conversationId
      conversation {
        title
        image {
          alt
          identityId
          key
          level
          type
        }
        country
        messages {
          items {
            conversationId
            text
            attachments {
              identityId
              key
              level
              type
            }
            users
            receiver
            sender
            createdBy
            readBy
            createdAt
            updatedAt
            id
            conversationMessagesId
          }
          nextToken
        }
        userConversations {
          items {
            conversationId
            conversation {
              title
              image {
                alt
                identityId
                key
                level
                type
              }
              country
              messages {
                items {
                  conversationId
                  text
                  users
                  receiver
                  sender
                  createdBy
                  readBy
                  createdAt
                  updatedAt
                  id
                  conversationMessagesId
                }
                nextToken
              }
              userConversations {
                items {
                  conversationId
                  userId
                  users
                  createdAt
                  updatedAt
                  id
                  conversationUserConversationsId
                }
                nextToken
              }
              users
              readBy
              createdBy
              createdAt
              updatedAt
              id
            }
            userId
            user {
              id
              identityId
              referralCode
              referredBy
              email
              about
              firstName
              firmId
              lastName
              phone
              blocked
              blockedBy
              country
              profileImg {
                alt
                identityId
                key
                level
                type
              }
              interests
              locale
              onboardingStatus
              onboardingEntity
              selectedSignatureKey
              signatures {
                items {
                  id
                  userId
                  key
                  createdAt
                  updatedAt
                }
                nextToken
              }
              userType
              rating
              reportReasons
              notificationPreferences {
                email
                push
                sms
              }
              paymentUserId
              providerWalletId
              providerNppCrn
              ipAddress
              createdAt
              updatedAt
              owner
              loyaltyStatus
              nextLoyaltyStatus
              nextLoyaltyStatusPoint
              statusPoint
              pointsTotal
              pointsBalance
              invitedTo
            }
            users
            createdAt
            updatedAt
            id
            conversationUserConversationsId
          }
          nextToken
        }
        users
        readBy
        createdBy
        createdAt
        updatedAt
        id
      }
      userId
      user {
        id
        identityId
        referralCode
        referredBy
        email
        about
        firstName
        firmId
        lastName
        phone
        blocked
        blockedBy
        country
        profileImg {
          alt
          identityId
          key
          level
          type
        }
        interests
        locale
        onboardingStatus
        onboardingEntity
        selectedSignatureKey
        signatures {
          items {
            id
            userId
            key
            createdAt
            updatedAt
          }
          nextToken
        }
        userType
        rating
        reportReasons
        notificationPreferences {
          email
          push
          sms
        }
        paymentUserId
        providerWalletId
        providerNppCrn
        ipAddress
        createdAt
        updatedAt
        owner
        loyaltyStatus
        nextLoyaltyStatus
        nextLoyaltyStatusPoint
        statusPoint
        pointsTotal
        pointsBalance
        invitedTo
      }
      users
      createdAt
      updatedAt
      id
      conversationUserConversationsId
    }
  }
`;
export const onUpdateUserConversation = /* GraphQL */ `
  subscription OnUpdateUserConversation(
    $filter: ModelSubscriptionUserConversationFilterInput
  ) {
    onUpdateUserConversation(filter: $filter) {
      conversationId
      conversation {
        title
        image {
          alt
          identityId
          key
          level
          type
        }
        country
        messages {
          items {
            conversationId
            text
            attachments {
              identityId
              key
              level
              type
            }
            users
            receiver
            sender
            createdBy
            readBy
            createdAt
            updatedAt
            id
            conversationMessagesId
          }
          nextToken
        }
        userConversations {
          items {
            conversationId
            conversation {
              title
              image {
                alt
                identityId
                key
                level
                type
              }
              country
              messages {
                items {
                  conversationId
                  text
                  users
                  receiver
                  sender
                  createdBy
                  readBy
                  createdAt
                  updatedAt
                  id
                  conversationMessagesId
                }
                nextToken
              }
              userConversations {
                items {
                  conversationId
                  userId
                  users
                  createdAt
                  updatedAt
                  id
                  conversationUserConversationsId
                }
                nextToken
              }
              users
              readBy
              createdBy
              createdAt
              updatedAt
              id
            }
            userId
            user {
              id
              identityId
              referralCode
              referredBy
              email
              about
              firstName
              firmId
              lastName
              phone
              blocked
              blockedBy
              country
              profileImg {
                alt
                identityId
                key
                level
                type
              }
              interests
              locale
              onboardingStatus
              onboardingEntity
              selectedSignatureKey
              signatures {
                items {
                  id
                  userId
                  key
                  createdAt
                  updatedAt
                }
                nextToken
              }
              userType
              rating
              reportReasons
              notificationPreferences {
                email
                push
                sms
              }
              paymentUserId
              providerWalletId
              providerNppCrn
              ipAddress
              createdAt
              updatedAt
              owner
              loyaltyStatus
              nextLoyaltyStatus
              nextLoyaltyStatusPoint
              statusPoint
              pointsTotal
              pointsBalance
              invitedTo
            }
            users
            createdAt
            updatedAt
            id
            conversationUserConversationsId
          }
          nextToken
        }
        users
        readBy
        createdBy
        createdAt
        updatedAt
        id
      }
      userId
      user {
        id
        identityId
        referralCode
        referredBy
        email
        about
        firstName
        firmId
        lastName
        phone
        blocked
        blockedBy
        country
        profileImg {
          alt
          identityId
          key
          level
          type
        }
        interests
        locale
        onboardingStatus
        onboardingEntity
        selectedSignatureKey
        signatures {
          items {
            id
            userId
            key
            createdAt
            updatedAt
          }
          nextToken
        }
        userType
        rating
        reportReasons
        notificationPreferences {
          email
          push
          sms
        }
        paymentUserId
        providerWalletId
        providerNppCrn
        ipAddress
        createdAt
        updatedAt
        owner
        loyaltyStatus
        nextLoyaltyStatus
        nextLoyaltyStatusPoint
        statusPoint
        pointsTotal
        pointsBalance
        invitedTo
      }
      users
      createdAt
      updatedAt
      id
      conversationUserConversationsId
    }
  }
`;
export const onDeleteUserConversation = /* GraphQL */ `
  subscription OnDeleteUserConversation(
    $filter: ModelSubscriptionUserConversationFilterInput
  ) {
    onDeleteUserConversation(filter: $filter) {
      conversationId
      conversation {
        title
        image {
          alt
          identityId
          key
          level
          type
        }
        country
        messages {
          items {
            conversationId
            text
            attachments {
              identityId
              key
              level
              type
            }
            users
            receiver
            sender
            createdBy
            readBy
            createdAt
            updatedAt
            id
            conversationMessagesId
          }
          nextToken
        }
        userConversations {
          items {
            conversationId
            conversation {
              title
              image {
                alt
                identityId
                key
                level
                type
              }
              country
              messages {
                items {
                  conversationId
                  text
                  users
                  receiver
                  sender
                  createdBy
                  readBy
                  createdAt
                  updatedAt
                  id
                  conversationMessagesId
                }
                nextToken
              }
              userConversations {
                items {
                  conversationId
                  userId
                  users
                  createdAt
                  updatedAt
                  id
                  conversationUserConversationsId
                }
                nextToken
              }
              users
              readBy
              createdBy
              createdAt
              updatedAt
              id
            }
            userId
            user {
              id
              identityId
              referralCode
              referredBy
              email
              about
              firstName
              firmId
              lastName
              phone
              blocked
              blockedBy
              country
              profileImg {
                alt
                identityId
                key
                level
                type
              }
              interests
              locale
              onboardingStatus
              onboardingEntity
              selectedSignatureKey
              signatures {
                items {
                  id
                  userId
                  key
                  createdAt
                  updatedAt
                }
                nextToken
              }
              userType
              rating
              reportReasons
              notificationPreferences {
                email
                push
                sms
              }
              paymentUserId
              providerWalletId
              providerNppCrn
              ipAddress
              createdAt
              updatedAt
              owner
              loyaltyStatus
              nextLoyaltyStatus
              nextLoyaltyStatusPoint
              statusPoint
              pointsTotal
              pointsBalance
              invitedTo
            }
            users
            createdAt
            updatedAt
            id
            conversationUserConversationsId
          }
          nextToken
        }
        users
        readBy
        createdBy
        createdAt
        updatedAt
        id
      }
      userId
      user {
        id
        identityId
        referralCode
        referredBy
        email
        about
        firstName
        firmId
        lastName
        phone
        blocked
        blockedBy
        country
        profileImg {
          alt
          identityId
          key
          level
          type
        }
        interests
        locale
        onboardingStatus
        onboardingEntity
        selectedSignatureKey
        signatures {
          items {
            id
            userId
            key
            createdAt
            updatedAt
          }
          nextToken
        }
        userType
        rating
        reportReasons
        notificationPreferences {
          email
          push
          sms
        }
        paymentUserId
        providerWalletId
        providerNppCrn
        ipAddress
        createdAt
        updatedAt
        owner
        loyaltyStatus
        nextLoyaltyStatus
        nextLoyaltyStatusPoint
        statusPoint
        pointsTotal
        pointsBalance
        invitedTo
      }
      users
      createdAt
      updatedAt
      id
      conversationUserConversationsId
    }
  }
`;
export const onCreateMessage = /* GraphQL */ `
  subscription OnCreateMessage($filter: ModelSubscriptionMessageFilterInput) {
    onCreateMessage(filter: $filter) {
      conversationId
      text
      attachments {
        identityId
        key
        level
        type
      }
      users
      receiver
      sender
      createdBy
      readBy
      createdAt
      updatedAt
      id
      conversationMessagesId
    }
  }
`;
export const onUpdateMessage = /* GraphQL */ `
  subscription OnUpdateMessage($filter: ModelSubscriptionMessageFilterInput) {
    onUpdateMessage(filter: $filter) {
      conversationId
      text
      attachments {
        identityId
        key
        level
        type
      }
      users
      receiver
      sender
      createdBy
      readBy
      createdAt
      updatedAt
      id
      conversationMessagesId
    }
  }
`;
