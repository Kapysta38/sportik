import {useState, useEffect} from "react";
import {useForm, FormProvider, useFormContext} from "react-hook-form";
import {TagsService, UsersService} from "@/client";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {Input} from "@chakra-ui/react";

type FormValues = {
    email: string;
    password: string;
    confirmPassword: string;
    first_name: string;
    last_name: string;
    gender: string;
    date_of_birth: string; // ISO
    tags: string[]; // UUID[]
};

function CredentialsStep() {
    const {register, formState: {errors}} = useFormContext<FormValues>();
    return (
        <>
            <Input {...register("email", {required: "Email обязателен"})} placeholder="Email"/>
            {errors.email && <p>{errors.email.message}</p>}
            <Input type="password" {...register("password", {required: "Пароль обязателен"})} placeholder="Пароль"/>
            <Input type="password" {...register("confirmPassword", {required: "Подтвердите пароль"})}
                   placeholder="Повторите пароль"/>
            {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}
        </>
    );
}

function PersonalStep() {
    const {register, formState: {}} = useFormContext<FormValues>();
    return (
        <>
            <Input {...register("first_name", {required: true})} placeholder="Имя"/>
            <Input {...register("last_name", {required: true})} placeholder="Фамилия"/>
            <select {...register("gender", {required: true})}>
                <option value="">Пол</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
            </select>
            <Input type="date" {...register("date_of_birth", {required: true})} />
        </>
    );
}


function TagsStep({availableTags}: { availableTags: { id: string; name: string }[] }) {
    const {watch, setValue, formState: {errors}} = useFormContext<FormValues>();
    const selected: string[] = watch("tags");

    return (
        <>
            <div>
                {availableTags.map(tag => (
                    <label key={tag.id}>
                        <input
                            type="checkbox"
                            value={tag.id}
                            checked={selected.includes(tag.id)}
                            onChange={() => {
                                const ids = selected.includes(tag.id)
                                    ? selected.filter(i => i !== tag.id)
                                    : [...selected, tag.id];
                                setValue("tags", ids, {shouldValidate: true});
                            }}
                        />
                        {tag.name}
                    </label>
                ))}
            </div>
            {errors.tags && <p>{errors.tags.message}</p>}
        </>
    );
}


function SignUpWizard() {
    const methods = useForm<FormValues>({defaultValues: {tags: []}});
    const {handleSubmit, trigger} = methods;
    const [step, setStep] = useState(1);
    const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string }>>([]);
    const navigate = useNavigate();

    // Шаг 3: подгрузка тегов
    useEffect(() => {
        if (step === 3) {
            TagsService.readTags({}).then(res => {
                setAvailableTags(res.data);
            });
        }
    }, [step]);

    const onNext = async () => {
        // валидация текущего шага
        let valid = false;
        if (step === 1) {
            valid = await trigger(["email", "password", "confirmPassword"]);
            if (methods.getValues("password") !== methods.getValues("confirmPassword")) {
                methods.setError("confirmPassword", {message: "Пароли не совпадают"});
                valid = false;
            }
        }
        if (step === 2) {
            valid = await trigger(["first_name", "last_name", "gender", "date_of_birth"]);
        }
        if (step === 3) {
            const tags = methods.getValues("tags");
            if (tags.length < 3) {
                methods.setError("tags", {message: "Выберите минимум 3 тега"});
                valid = false;
            } else {
                valid = true;
            }
        }
        if (valid) setStep(step + 1);
    };

    const onSubmit = handleSubmit(async (data) => {
        // финальный submit
        try {
            await UsersService.registerUser({
                requestBody: {
                    email: data.email,
                    password: data.password,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    gender: data.gender,
                    date_of_birth: data.date_of_birth,
                    // tags: data.tags,
                },
            });
            navigate({to: "/"}); // перенаправить на главную
        } catch (err) {
            console.error(err);
            methods.setError("email", {message: "Ошибка регистрации"});
        }
    });

    return (
        <FormProvider {...methods}>
            <form onSubmit={step === 3 ? onSubmit : (e) => {
                e.preventDefault();
                onNext();
            }}>
                {step === 1 && <CredentialsStep/>}
                {step === 2 && <PersonalStep/>}
                {step === 3 && <TagsStep availableTags={availableTags}/>}
                <div style={{marginTop: 24}}>
                    {step > 1 && <button type="button" onClick={() => setStep(step - 1)}>← Назад</button>}
                    <button type="submit">
                        {step < 3 ? "Далее" : "Зарегистрироваться"}
                    </button>
                </div>
                <button className=" px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ">
                    Кнопка
                </button>
            </form>
        </FormProvider>
    );
}


export const Route = createFileRoute('/signup')({
    component: SignUpWizard,
});

export default SignUpWizard
