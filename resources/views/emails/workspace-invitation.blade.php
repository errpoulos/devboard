<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Workspace Invitation</title>
</head>
<body>
    <h1>You've been invited to {{ $invitation->workspace->name }}</h1>
    <p>
        {{ $invitation->inviter->name }} has invited you to join
        <strong>{{ $invitation->workspace->name }}</strong> as a <strong>{{ $invitation->role }}</strong>.
    </p>
    <p>
        <a href="{{ config('app.url') }}/invitations/{{ $invitation->token }}">Accept Invitation</a>
    </p>
    <p>This invitation expires on {{ $invitation->expires_at->format('F j, Y') }}.</p>
</body>
</html>
