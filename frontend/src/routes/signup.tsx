// src/routes/signup.tsx
import {useState, useEffect} from "react";
import {
    useForm,
    FormProvider,
    useFormContext,
    SubmitHandler,
} from "react-hook-form";
import {TagsService, UserPublic, UsersService, UserTagsService} from "@/client";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {
    Box,
    Button,
    Input,
    Stack,
    Heading,
    Text,
    Checkbox,
    HStack,
    VStack,
    Wrap,
    WrapItem
} from "@chakra-ui/react";
import {MobileFrame} from "@/components/MobileFrame";

type FormValues = {
    email: string;
    password: string;
    confirmPassword: string;
    first_name: string;
    last_name: string;
    gender: string;
    date_of_birth: string;
    tags: string[];
};

const green = {bg: "green.500", color: "white", _hover: {bg: "green.600"}};

function CredentialsStep() {
    const {
        register,
        formState: {errors},
        watch,
    } = useFormContext<FormValues>();

    return (
        <Stack gap={3} mt={6}>
            <Input
                {...register("email", {
                    required: "Email обязателен",
                    pattern: {
                        value: /^\S+@\S+$/i,
                        message: "Неверный формат email",
                    },
                })}
                placeholder="Email"
            />
            {errors.email && (
                <Text color="red.500">{errors.email.message}</Text>
            )}

            <Input
                type="password"
                {...register("password", {
                    required: "Пароль обязателен",
                    minLength: {value: 6, message: "Минимум 6 символов"},
                })}
                placeholder="Пароль"
            />
            {errors.password && (
                <Text color="red.500">{errors.password.message}</Text>
            )}

            <Input
                type="password"
                {...register("confirmPassword", {
                    required: "Подтвердите пароль",
                    validate: (value) =>
                        value === watch("password") || "Пароли не совпадают",
                })}
                placeholder="Повторите пароль"
            />
            {errors.confirmPassword && (
                <Text color="red.500">{errors.confirmPassword.message}</Text>
            )}
        </Stack>
    );
}

function PersonalStep() {
    const {
        register,
        formState: {errors},
    } = useFormContext<FormValues>();

    return (
        <Stack gap={3} mt={6}>
            <Input
                {...register("first_name", {required: "Имя обязательно"})}
                placeholder="Имя"
            />
            {errors.first_name && (
                <Text color="red.500">{errors.first_name.message}</Text>
            )}

            <Input
                {...register("last_name", {required: "Фамилия обязательна"})}
                placeholder="Фамилия"
            />
            {errors.last_name && (
                <Text color="red.500">{errors.last_name.message}</Text>
            )}

            <Input
                {...register("gender", {required: "Пол обязателен"})}
                placeholder="Пол"
            />
            {errors.gender && (
                <Text color="red.500">{errors.gender.message}</Text>
            )}

            <Input
                type="date"
                {...register("date_of_birth", {required: "Дата рождения обязательна"})}
            />
            {errors.date_of_birth && (
                <Text color="red.500">{"Дата рождения обязательна"}</Text>
            )}
        </Stack>
    );
}

function TagsStep({availableTags}: { availableTags: { id: string; name: string }[] }) {
    const {watch, setValue, formState: {errors}} = useFormContext<FormValues>()
    const selected: string[] = watch("tags")

    return (
        <VStack gap={4} mt="6">
            <Text textAlign="center" fontSize="sm">
                Что тебе интересно?<br/>Выбери минимум 3 тега
            </Text>
            <Wrap spacing={2} justify="center">
                {availableTags.map(tag => {
                    const isSelected = selected.includes(tag.id)
                    return (
                        <WrapItem key={tag.id}>
                            <Checkbox.Root
                                id={tag.id}
                                isChecked={isSelected}
                                onCheckedChange={(val: boolean) => {
                                    const ids = val
                                        ? [...selected, tag.id]
                                        : selected.filter(i => i !== tag.id)
                                    setValue("tags", ids, {shouldValidate: true})
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    border: "1px solid lightgreen",
                                    padding: "10px",
                                    borderRadius: "10px",

                                    textAlign: "center"

                                }}
                                bg={ isSelected ? "lightgreen" : 'white'}
                            >
                                <Checkbox.HiddenInput/>
                                <Checkbox.Label htmlFor={tag.id} ml="2">
                                    {tag.name}
                                </Checkbox.Label>
                            </Checkbox.Root>
                        </WrapItem>
                    )
                }

                )}
            </Wrap>
            {errors.tags && (
                <Text color="red.500" fontSize="sm">
                    {errors.tags.message}
                </Text>
            )}
        </VStack>
    )
}

function SignUpWizard() {
    const methods = useForm<FormValues>({
        defaultValues: {tags: []},
        mode: "onTouched",
    });
    const {handleSubmit, trigger, getValues, setError} = methods;
    const [step, setStep] = useState(1);
    const [availableTags, setAvailableTags] = useState<
        { id: string; name: string }[]
    >([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (step === 3) {
            TagsService.readTags({}).then((res) => {
                setAvailableTags(res.data);
            });
        }
    }, [step]);

    const onNext = async () => {
        let valid = false;
        if (step === 1) {
            valid = await trigger([
                "email",
                "password",
                "confirmPassword",
            ]);
        }
        if (step === 2) {
            valid = await trigger([
                "first_name",
                "last_name",
                "gender",
                "date_of_birth",
            ]);
        }
        if (step === 3) {
            const tags = getValues("tags");
            if (tags.length < 3) {
                setError("tags", {message: "Выберите минимум 3 тега"});
                valid = false;
            } else {
                valid = true;
            }
        }

        if (valid) {
            setStep((s) => s + 1);
        }
    };

    const onSubmit = handleSubmit(async (data) => {
        try {
            // 1) создаём пользователя
            const res: UserPublic = await UsersService.registerUser({
                requestBody: {
                    email: data.email,
                    password: data.password,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    gender: data.gender,
                    date_of_birth: data.date_of_birth,
                },
            });
            const createdUser = res;  // <-- UserPublic с полем id

            // 2) «прицепляем» теги
            await Promise.all(
                data.tags.map((tagId) =>
                    UserTagsService.assignTag({
                        userId: createdUser.id,
                        tagId,
                    })
                )
            );

            // 3) редирект на главную
            navigate({to: "/"});
        } catch (err: any) {
            console.error(err);
            methods.setError("email", {message: "Ошибка регистрации"});
        }
    });

    return (
        <MobileFrame>
            <Heading size="md" textAlign="center">
                {step === 1 && "Привет! Готов авторизоваться?"}
                {step === 2 && "Дополни профиль"}
                {step === 3 && "Выбери интересы"}
            </Heading>

            <FormProvider {...methods}>
                <Box
                    as="form"
                    onSubmit={
                        step === 3
                            ? handleSubmit(onSubmit)
                            : (e) => {
                                e.preventDefault();
                                onNext();
                            }
                    }
                >
                    {step === 1 && <CredentialsStep/>}
                    {step === 2 && <PersonalStep/>}
                    {step === 3 && (
                        <TagsStep availableTags={availableTags}/>
                    )}

                    <HStack justify="space-between" mt={8}>
                        {step > 1 && (
                            <Button
                                variant="outline"
                                onClick={() => setStep((s) => s - 1)}
                            >
                                ← Назад
                            </Button>
                        )}
                        <Button type="submit" {...green}>
                            {step < 3 ? "Далее" : "Готово"}
                        </Button>
                    </HStack>
                </Box>
            </FormProvider>
        </MobileFrame>
    );
}

export const Route = createFileRoute("/signup")({
    component: SignUpWizard,
});

export default SignUpWizard;
