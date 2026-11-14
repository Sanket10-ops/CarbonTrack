import { Blobatar } from "@blobatar/react";

function UserAvatar({ username, size = 48 }) {
    return (
        <Blobatar
            name={username}
            size={size}
        />
    );
}

export default UserAvatar;