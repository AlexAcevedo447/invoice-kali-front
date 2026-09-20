import { UserCreateForm } from "../forms/UserCreateForm";

export const UsersPage = () => {
    return (
        <section className="p-5">
            <h2>Users</h2>
            <UserCreateForm />
        </section>
    );
};
