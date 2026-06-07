import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUser, listUsers, toggleUser } from "../api/auth";
import { MaterialIcon } from "../components/MaterialIcon";

const userSchema = z.object({
  full_name: z.string().min(1, "الاسم الكامل مطلوب"),
  email: z.string().min(1, "البريد الإلكتروني مطلوب").email("بريد إلكتروني غير صالح"),
  password: z.string().min(6, "6 أحرف على الأقل"),
  role: z.enum(["admin", "professor"]),
});

type UserForm = z.infer<typeof userSchema>;

export function Users() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: users, isLoading } = useQuery({ queryKey: ["users"], queryFn: listUsers });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserForm>({ resolver: zodResolver(userSchema), defaultValues: { role: "professor" } });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      reset();
      setShowForm(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <div className="space-y-md">
      <div className="flex items-start justify-between gap-md flex-wrap">
        <div>
          <h2 className="font-arabic-headline text-arabic-headline text-primary mb-xs">إدارة المستخدمين</h2>
          <p className="font-arabic-body text-arabic-body text-on-surface-variant">
            إنشاء حسابات الأساتذة والإداريين، وتفعيل أو تعطيل الحسابات.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-md py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-sm text-label-sm shadow-md flex items-center gap-xs"
        >
          <MaterialIcon name="person_add" className="text-[18px]" />
          {showForm ? "إلغاء" : "مستخدم جديد"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit((values) => createMutation.mutate(values))}
          className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md grid grid-cols-1 md:grid-cols-2 gap-md"
        >
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface font-semibold">الاسم الكامل</label>
            <input
              className="bg-surface-container-low border border-outline-variant rounded-lg px-sm py-sm font-arabic-body text-arabic-body focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              {...register("full_name")}
            />
            {errors.full_name && <p className="font-label-sm text-label-sm text-error">{errors.full_name.message}</p>}
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface font-semibold">البريد الإلكتروني</label>
            <input
              dir="ltr"
              className="bg-surface-container-low border border-outline-variant rounded-lg px-sm py-sm font-arabic-body text-arabic-body focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              {...register("email")}
            />
            {errors.email && <p className="font-label-sm text-label-sm text-error">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface font-semibold">كلمة المرور</label>
            <input
              dir="ltr"
              type="password"
              className="bg-surface-container-low border border-outline-variant rounded-lg px-sm py-sm font-arabic-body text-arabic-body focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              {...register("password")}
            />
            {errors.password && <p className="font-label-sm text-label-sm text-error">{errors.password.message}</p>}
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface font-semibold">الدور</label>
            <select
              className="bg-surface-container-low border border-outline-variant rounded-lg px-sm py-sm font-arabic-body text-arabic-body focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              {...register("role")}
            >
              <option value="professor">أستاذ</option>
              <option value="admin">مدير</option>
            </select>
          </div>
          {createMutation.isError && (
            <p className="md:col-span-2 font-label-sm text-label-sm text-error">
              تعذر إنشاء المستخدم. ربما البريد الإلكتروني مستخدم من قبل.
            </p>
          )}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-md py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-sm text-label-sm shadow-md disabled:opacity-50"
            >
              {createMutation.isPending ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-primary-container text-on-primary-container font-label-sm text-label-sm">
              <th className="py-sm px-md font-semibold">الاسم</th>
              <th className="py-sm px-md font-semibold">البريد الإلكتروني</th>
              <th className="py-sm px-md font-semibold">الدور</th>
              <th className="py-sm px-md font-semibold">الحالة</th>
              <th className="py-sm px-md font-semibold text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="font-arabic-body text-arabic-body text-on-surface">
            {isLoading && (
              <tr>
                <td colSpan={5} className="py-lg px-md text-center text-on-surface-variant">
                  جارٍ التحميل...
                </td>
              </tr>
            )}
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-outline-variant last:border-b-0">
                <td className="py-sm px-md font-semibold">{u.full_name}</td>
                <td className="py-sm px-md font-mono text-sm text-on-surface-variant" dir="ltr">
                  {u.email}
                </td>
                <td className="py-sm px-md">{u.role === "admin" ? "مدير" : "أستاذ"}</td>
                <td className="py-sm px-md">
                  {u.is_active ? (
                    <span className="inline-flex items-center gap-xs px-2 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      نشط
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-xs px-2 py-1 rounded-full bg-error-container text-on-error-container text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-error" />
                      معطل
                    </span>
                  )}
                </td>
                <td className="py-sm px-md text-left">
                  <button
                    onClick={() => toggleMutation.mutate(u.id)}
                    disabled={toggleMutation.isPending}
                    className="font-label-sm text-label-sm text-secondary hover:text-on-secondary-fixed-variant transition-colors disabled:opacity-50"
                  >
                    {u.is_active ? "تعطيل" : "تفعيل"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
