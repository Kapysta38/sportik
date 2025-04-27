// src/routes/login.tsx
import { useForm, SubmitHandler } from "react-hook-form"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import {
  Container,
  Image,
  Input,
  Text,
  VStack,
  Link,
} from "@chakra-ui/react"
import { FiLock, FiMail } from "react-icons/fi"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import Logo from "/assets/images/fastapi-logo.svg"
import { emailPattern, passwordRules } from "@/utils"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import { MobileFrame } from "@/components/MobileFrame"

export const Route = createFileRoute("/login")({
  component: Login,
})

const green = { bg: "green.500", color: "white", _hover: { bg: "green.600" } };

function Login() {
  const { loginMutation, error, resetError } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccessToken>({
    mode: "onBlur",
    defaultValues: { username: "", password: "" },
  })

  // если уже залогинен — редирект на главную
  if (isLoggedIn()) {
    navigate({ to: "/" })
  }

  const onSubmit: SubmitHandler<AccessToken> = async (data) => {
    if (isSubmitting) return
    resetError()
    try {
      await loginMutation.mutateAsync(data)
      navigate({ to: "/" })
    } catch {
      // ошибка обрабатывается в useAuth
    }
  }

  return (
      <MobileFrame>
        <VStack
            as="form"
            onSubmit={handleSubmit(onSubmit)}
            spacing={4}
            mt={8}
        >

          <Field invalid={!!errors.username || !!error}
                 errorText={errors.username?.message || (error ? "Login failed" : "")}>
            <InputGroup startElement={<FiMail />}>
              <Input
                  id="username"
                  type="email"
                  placeholder="Email"
                  {...register("username", {
                    required: "Email обязателен",
                    pattern: emailPattern,
                  })}
              />
            </InputGroup>
          </Field>

          <PasswordInput
              startElement={<FiLock />}
              placeholder="Пароль"
              {...register("password", passwordRules())}
              errors={errors}
          />

          <Link
              onClick={() => navigate({ to: "recover-password" })}
              color="blue.500"
              fontSize="sm"
              alignSelf="flex-end"
          >
            Забыли пароль?
          </Link>

          <Button
              variant="solid"
              type="submit"
              isLoading={isSubmitting}
              w="full"
              {...green}
          >
            Войти
          </Button>

          <Text fontSize="sm" textAlign="center">
            Нет аккаунта?{" "}
            <Link
                onClick={() => navigate({ to: "/signup" })}
                color="blue.500"
            >
              Зарегистрироваться
            </Link>
          </Text>
        </VStack>
      </MobileFrame>
  )
}
