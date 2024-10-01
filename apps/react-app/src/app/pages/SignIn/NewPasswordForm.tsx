import {
  WBAlert,
  WBBox,
  WBButton,
  WBFlex,
  WBForm,
  WBIconButton,
  WBTextField,
  WBTypography,
} from '@admiin-com/ds-web';
import { useMemo, useRef, useState } from 'react';
import {
  AuthError,
  PASSWORD_POLICY,
  RequestStatus,
} from '@admiin-com/ds-common';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { PasswordPolicyCheck } from '../../components/PasswordPolicyCheck/PasswordPolicyCheck';
import AdmiinLogo from '../../components/AdmiinLogo/AdmiinLogo';

export interface NewPasswordFormData {
  oldPassword: string;
  newPassword: string;
  passwordConfirm: string;
}

interface NewPasswordFormProps {
  authStatus: RequestStatus;
  authError: AuthError;
  oldPassword?: string;
  submittedEmail?: string;
  onSubmit: SubmitHandler<NewPasswordFormData>;
}

const NewPasswordForm = ({
  authStatus,
  authError,
  oldPassword,
  onSubmit,
}: NewPasswordFormProps) => {
  const { t } = useTranslation();
  const [isOldVisible, setIsOldVisible] = useState(false);
  const [isNewVisible, setIsNewVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const oldPasswordInput = useRef(null);
  const newPasswordInput = useRef(null);
  const passwordConfirmInput = useRef(null);
  const {
    control,
    formState: { errors },
    handleSubmit,
    watch,
  } = useForm<NewPasswordFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });
  const { newPassword } = watch();
  const hasLowercase = (value: string) => /[a-z]/.test(value);
  const hasUppercase = (value: string) => /[A-Z]/.test(value);
  const hasNumber = (value: string) => /[0-9]/.test(value);
  const hasSymbol = (value: string) => /[^A-Za-z0-9]/.test(value);
  const inputs = useMemo(
    () => ({
      oldPassword: {
        label: t('oldPasswordTitle', { ns: 'common' }),
        name: 'oldPassword' as const,
        type: 'password',
        placeholder: '',
        defaultValue: oldPassword || '',
        rules: {
          required: t('oldPasswordRequired', { ns: 'common' }),
        },
      },
      newPassword: {
        label: t('newPasswordTitle', { ns: 'common' }),
        name: 'newPassword' as const,
        type: 'password',
        placeholder: '',
        defaultValue: '',
        rules: {
          required: t('newPasswordRequired', { ns: 'common' }),
          minLength: {
            value: PASSWORD_POLICY.length,
            message: `${t('passwordMustBe', { ns: 'common' })} ${
              PASSWORD_POLICY.length
            } ${t('orMoreCharacters', { ns: 'common' })}`,
          },
          validate: {
            lowercase: (value: string) =>
              PASSWORD_POLICY.lowercase
                ? /[a-z]/.test(value) ||
                  'Password must include at least one lowercase letter'
                : true,
            uppercase: (value: string) =>
              PASSWORD_POLICY.uppercase
                ? /[A-Z]/.test(value) ||
                  'Password must include at least one uppercase letter'
                : true,
            number: (value: string) =>
              PASSWORD_POLICY.numbers
                ? /[0-9]/.test(value) ||
                  'Password must include at least one number'
                : true,
            symbol: (value: string) =>
              PASSWORD_POLICY.symbols
                ? /[^A-Za-z0-9]/.test(value) ||
                  'Password must include at least one symbol'
                : true,
          },
        },
      },
      passwordConfirm: {
        name: 'passwordConfirm' as const,
        label: t('confirmPasswordTitle', { ns: 'common' }),
        placeholder: '',
        defaultValue: '',
        rules: {
          required: t('confirmPasswordRequired', { ns: 'common' }),
          validate: (value: string) =>
            value === newPassword || t('confirmNotMatch', { ns: 'common' }),
        },
      },
    }),
    [t, newPassword, oldPassword]
  );

  /**
   * Renders the show / hide password for input
   *
   * @returns {*}
   */
  const showHidePassword = (
    isPasswordVisible: boolean,
    onClick: (isPasswordVisible: boolean) => void
  ) => (
    <WBIconButton
      size="small"
      icon={isPasswordVisible ? 'EyeOff' : 'Eye'}
      onClick={() => onClick(!isPasswordVisible)}
    />
  );

  return (
    <WBFlex
      flexDirection="column"
      alignItems="center"
      width={{
        xs: '80%',
        sm: '80%',
        md: '60%',
        lg: '60%',
      }}
    >
      <WBBox sx={{ mb: { md: 5, xs: 1 } }}>
        <WBTypography
          variant="h2"
          sx={{
            mt: {
              xs: 5,
              sm: 2,
            },
          }}
        >
          {t('newPasswordContinue', { ns: 'common' })}
        </WBTypography>
      </WBBox>
      <WBFlex width={'100%'} justifyContent={'start'} mt={2}>
        <AdmiinLogo />
      </WBFlex>
      <WBForm onSubmit={handleSubmit(onSubmit)} alignSelf="stretch">
        {/* <WBTextField type="hidden" autoComplete="username" /> */}

        <Controller
          control={control}
          name={inputs.oldPassword.name}
          rules={inputs.oldPassword.rules}
          defaultValue={inputs.oldPassword.defaultValue}
          render={({ field }) => (
            <WBTextField
              {...field}
              type={isOldVisible ? 'text' : 'password'}
              inputRef={oldPasswordInput}
              label={inputs.oldPassword.label}
              autoComplete="current-password"
              rightIcon={showHidePassword(isOldVisible, setIsOldVisible)}
              error={!!(errors.oldPassword && errors.oldPassword.message)}
              helperText={
                (errors.oldPassword && errors.oldPassword.message) || ''
              }
              margin="dense"
            />
          )}
        />

        <Controller
          control={control}
          name={inputs.newPassword.name}
          rules={inputs.newPassword.rules}
          defaultValue={inputs.newPassword.defaultValue}
          render={({ field }) => (
            <WBTextField
              {...field}
              type={isNewVisible ? 'text' : 'password'}
              inputRef={newPasswordInput}
              label={inputs.newPassword.label}
              autoComplete="new-password"
              rightIcon={showHidePassword(isNewVisible, setIsNewVisible)}
              error={!!(errors.newPassword && errors.newPassword.message)}
              helperText={
                (errors.newPassword && errors.newPassword.message) || ''
              }
              margin="dense"
            />
          )}
        />

        <Controller
          control={control}
          name={inputs.passwordConfirm.name}
          rules={inputs.passwordConfirm.rules}
          defaultValue={inputs.passwordConfirm.defaultValue}
          render={({ field }) => (
            <WBTextField
              {...field}
              type={isConfirmVisible ? 'text' : 'password'}
              inputRef={passwordConfirmInput}
              label={inputs.passwordConfirm.label}
              autoComplete="new-password"
              rightIcon={showHidePassword(
                isConfirmVisible,
                setIsConfirmVisible
              )}
              error={
                !!(errors.passwordConfirm && errors.passwordConfirm.message)
              }
              helperText={
                (errors.passwordConfirm && errors.passwordConfirm.message) || ''
              }
              margin="dense"
            />
          )}
        />

        <input hidden type="text" autoComplete="username" />

        {authError?.code && (
          <WBAlert
            title={t(authError.code, { ns: 'authentication' })}
            severity="error"
          />
        )}

        <PasswordPolicyCheck password={newPassword} sx={{ mt: 1 }} />

        <WBButton
          loading={authStatus === 'submitting'}
          sx={{
            mt: 5,
            alignSelf: 'flex-start',
          }}
          fullWidth
        >
          {t('updateTitle', { ns: 'common' })}
        </WBButton>
      </WBForm>
    </WBFlex>
  );
};

export default NewPasswordForm;
