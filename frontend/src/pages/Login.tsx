import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { MaterialIcon } from "../components/MaterialIcon";

const loginSchema = z.object({
  email: z.string().min(1, "البريد الإلكتروني مطلوب").email("بريد إلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginForm) {
    setServerError(null);
    try {
      await login(values.email, values.password);
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/search";
      navigate(from, { replace: true });
    } catch {
      setServerError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center font-arabic-body p-margin-mobile">
      <div className="w-full max-w-[1100px] flex flex-col md:flex-row bg-surface rounded-xl overflow-hidden shadow-[0px_4px_20px_rgba(0,33,71,0.08)]">
        {/* Form Section */}
        <div className="w-full md:w-1/2 flex flex-col justify-center p-margin-mobile md:p-margin-desktop bg-surface z-10">
          <div className="mb-lg flex flex-col items-start">
            <div className="flex items-center gap-sm mb-xs">
              <MaterialIcon name="account_balance" filled className="text-[40px] text-primary" />
              <h1 className="font-arabic-headline text-arabic-headline text-primary m-0">FSJES عين الشق</h1>
            </div>
            <p className="font-arabic-body text-arabic-body text-on-surface-variant m-0">
              نظام تدبير النقاط — البوابة الأكاديمية
            </p>
          </div>

          <div className="mb-md">
            <h2 className="font-arabic-headline text-[32px] font-bold text-primary mb-xs">تسجيل الدخول</h2>
            <p className="font-arabic-body text-arabic-body text-on-surface-variant">
              الرجاء إدخال بيانات الاعتماد الخاصة بك للوصول إلى النظام.
            </p>
          </div>

          <form className="space-y-md" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant block" htmlFor="email">
                البريد الإلكتروني
              </label>
              <div className="relative flex items-center bg-surface-container-low rounded-lg border-b border-outline-variant focus-within:border-primary transition-all">
                <span className="material-symbols-outlined absolute right-sm text-outline">person</span>
                <input
                  className="w-full bg-transparent border-none py-sm pr-10 pl-sm font-body-md text-body-md text-on-surface focus:ring-0 placeholder:text-outline/50"
                  dir="ltr"
                  id="email"
                  placeholder="admin@fsjes.ma"
                  type="email"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="font-label-sm text-label-sm text-error">{errors.email.message}</p>}
            </div>

            <div className="space-y-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant block" htmlFor="password">
                كلمة المرور
              </label>
              <div className="relative flex items-center bg-surface-container-low rounded-lg border-b border-outline-variant focus-within:border-primary transition-all">
                <span className="material-symbols-outlined absolute right-sm text-outline">lock</span>
                <input
                  className="w-full bg-transparent border-none py-sm pr-10 pl-10 font-body-md text-body-md text-on-surface focus:ring-0 placeholder:text-outline/50"
                  dir="ltr"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                />
                <button
                  className="absolute left-sm text-outline hover:text-on-surface transition-colors"
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="إظهار كلمة المرور"
                >
                  <span className="material-symbols-outlined">{showPassword ? "visibility" : "visibility_off"}</span>
                </button>
              </div>
              {errors.password && <p className="font-label-sm text-label-sm text-error">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="bg-error-container text-on-error-container rounded-lg p-sm font-label-sm text-label-sm">
                {serverError}
              </div>
            )}

            <button
              className="w-full bg-primary text-on-primary font-arabic-headline text-[20px] font-semibold py-sm rounded-lg hover:bg-primary-container transition-colors duration-300 mt-md flex items-center justify-center gap-sm disabled:opacity-60"
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? "جارٍ الدخول..." : "دخول"}</span>
              {!isLoading && <span className="material-symbols-outlined">arrow_forward</span>}
            </button>
          </form>

          <div className="mt-auto pt-lg text-center">
            <p className="font-label-sm text-label-sm text-outline">© 2026 جامعة الحسن الثاني بالدار البيضاء — كلية الحقوق عين الشق</p>
          </div>
        </div>

        {/* Brand panel */}
        <div className="hidden md:flex md:w-1/2 relative bg-gradient-to-br from-primary to-primary-container items-end p-margin-desktop">
          <div className="text-on-primary max-w-md bg-white/10 backdrop-blur-md p-md rounded-xl border border-white/20">
            <div className="flex items-center gap-sm mb-sm">
              <MaterialIcon name="star" filled className="text-[32px] text-secondary-fixed" />
              <h3 className="font-arabic-headline text-[24px] text-on-primary m-0">التميز الأكاديمي</h3>
            </div>
            <p className="font-arabic-body text-body-md text-on-primary/90 m-0">
              نظام متكامل لتدبير بيانات النقط الخاصة بالطلبة الأقدمين، يضمن السرعة في البحث والدقة في الطباعة وتتبع كل عملية.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
