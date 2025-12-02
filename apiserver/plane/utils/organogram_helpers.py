# Django imports
from django.core.exceptions import ValidationError
from django.db.models import Q

# Module imports
from plane.db.models import (
    OrganogramPosition,
    UserPosition,
    WorkspaceMember,
    User,
)


def get_all_child_positions(position_id, include_self=False):
    """
    Recursively get all child positions for a given position.

    Args:
        position_id (uuid): The ID of the parent position
        include_self (bool): Whether to include the position itself in the results

    Returns:
        list: List of OrganogramPosition objects
    """
    try:
        position = OrganogramPosition.objects.get(id=position_id, deleted_at__isnull=True)
    except OrganogramPosition.DoesNotExist:
        return []

    children = []
    if include_self:
        children.append(position)

    # Get direct children
    direct_children = OrganogramPosition.objects.filter(
        parent=position, deleted_at__isnull=True
    )

    for child in direct_children:
        children.append(child)
        # Recursively get grandchildren
        children.extend(get_all_child_positions(child.id, include_self=False))

    return children


def get_users_from_positions(position_ids):
    """
    Get all users assigned to the given positions.

    Args:
        position_ids (list): List of position IDs

    Returns:
        QuerySet: User objects
    """
    user_positions = UserPosition.objects.filter(
        position_id__in=position_ids,
        deleted_at__isnull=True
    ).select_related('user')

    user_ids = user_positions.values_list('user_id', flat=True)
    return User.objects.filter(id__in=user_ids)


def sync_workspace_members_from_organogram(workspace_id, position_ids, default_role=15):
    """
    Add users from selected organogram positions to workspace members.
    This includes users from child positions as well.

    Args:
        workspace_id (uuid): The workspace ID
        position_ids (list): List of position IDs to include
        default_role (int): Default role for new members (15=Member by default)

    Returns:
        dict: Summary of operation (added_count, already_members_count, users_added)
    """
    # Get all positions including children
    all_positions = []
    for position_id in position_ids:
        positions = get_all_child_positions(position_id, include_self=True)
        all_positions.extend(positions)

    # Remove duplicates
    unique_position_ids = list(set([p.id for p in all_positions]))

    # Get all users from these positions
    users = get_users_from_positions(unique_position_ids)

    added_members = []
    already_members = []

    for user in users:
        # Check if user is already a workspace member
        existing_member = WorkspaceMember.objects.filter(
            workspace_id=workspace_id,
            member=user,
            deleted_at__isnull=True,
            is_active=True
        ).first()

        if existing_member:
            already_members.append(user)
        else:
            # Create workspace member
            member = WorkspaceMember.objects.create(
                workspace_id=workspace_id,
                member=user,
                role=default_role,
                is_active=True
            )
            added_members.append(user)

    return {
        'added_count': len(added_members),
        'already_members_count': len(already_members),
        'users_added': [{'id': str(u.id), 'email': u.email, 'display_name': u.display_name} for u in added_members],
    }


def validate_position_hierarchy(position_id, parent_id):
    """
    Validate that setting a parent doesn't create a circular reference.

    Args:
        position_id (uuid): The position being updated
        parent_id (uuid): The proposed parent position ID

    Returns:
        bool: True if valid, raises ValidationError if invalid
    """
    if not parent_id:
        return True

    if position_id == parent_id:
        raise ValidationError("A position cannot be its own parent")

    try:
        parent = OrganogramPosition.objects.get(id=parent_id, deleted_at__isnull=True)
    except OrganogramPosition.DoesNotExist:
        raise ValidationError("Parent position does not exist")

    # Check if parent is in the same workspace
    try:
        position = OrganogramPosition.objects.get(id=position_id, deleted_at__isnull=True)
        if parent.workspace != position.workspace:
            raise ValidationError("Parent position must be in the same workspace")
    except OrganogramPosition.DoesNotExist:
        # New position, workspace check will be done elsewhere
        pass

    # Check for circular reference
    current = parent
    visited = {position_id}

    while current:
        if current.id in visited:
            raise ValidationError("Circular parent-child relationship detected")
        visited.add(current.id)
        current = current.parent

    return True


def get_user_reporting_chain(user_id, workspace_id):
    """
    Get the reporting chain for a user in a specific workspace.
    Returns the hierarchy from the user's position up to the top.

    Args:
        user_id (uuid): The user ID
        workspace_id (uuid): The workspace ID

    Returns:
        list: List of position dictionaries in hierarchical order
    """
    # Get user's positions in this workspace
    user_positions = UserPosition.objects.filter(
        user_id=user_id,
        position__workspace_id=workspace_id,
        deleted_at__isnull=True
    ).select_related('position')

    if not user_positions.exists():
        return []

    # For simplicity, take the first position if user has multiple
    # In practice, you might want to handle multiple positions differently
    position = user_positions.first().position

    # Build reporting chain
    chain = []
    current = position

    while current:
        chain.append({
            'id': str(current.id),
            'name': current.name,
            'authority': current.authority,
            'description': current.description,
        })
        current = current.parent

    return chain


def validate_user_assignment_to_position(user_id, position_id):
    """
    Validate that a user can be assigned to a position.
    Checks constraints like single user for Head/LineManager positions.

    Args:
        user_id (uuid): The user ID
        position_id (uuid): The position ID

    Returns:
        bool: True if valid, raises ValidationError if invalid
    """
    try:
        position = OrganogramPosition.objects.get(id=position_id, deleted_at__isnull=True)
    except OrganogramPosition.DoesNotExist:
        raise ValidationError("Position does not exist")

    # Check if user is already assigned
    existing_assignment = UserPosition.objects.filter(
        user_id=user_id,
        position_id=position_id,
        deleted_at__isnull=True
    ).exists()

    if existing_assignment:
        raise ValidationError("User is already assigned to this position")

    # Check Head/LineManager constraint
    if position.authority in ['head', 'line_manager']:
        existing_users = UserPosition.objects.filter(
            position=position,
            deleted_at__isnull=True
        ).exists()

        if existing_users:
            raise ValidationError(
                f"Position '{position.name}' with authority '{position.get_authority_display()}' "
                "can only have one user assigned"
            )

    return True


def get_positions_by_authority(workspace_id, authority_type):
    """
    Get all positions of a specific authority type in a workspace.

    Args:
        workspace_id (uuid): The workspace ID
        authority_type (str): The authority type ('head', 'line_manager', or 'none')

    Returns:
        QuerySet: OrganogramPosition objects
    """
    return OrganogramPosition.objects.filter(
        workspace_id=workspace_id,
        authority=authority_type,
        deleted_at__isnull=True
    ).select_related('workspace', 'parent')


def get_user_subordinates(user_id, workspace_id):
    """
    Get all users who report to this user (directly or indirectly).

    Args:
        user_id (uuid): The user ID
        workspace_id (uuid): The workspace ID

    Returns:
        list: List of User objects
    """
    # Get user's positions in this workspace
    user_positions = UserPosition.objects.filter(
        user_id=user_id,
        position__workspace_id=workspace_id,
        deleted_at__isnull=True
    ).select_related('position')

    if not user_positions.exists():
        return []

    all_subordinates = []

    for user_position in user_positions:
        position = user_position.position

        # Get all child positions
        child_positions = get_all_child_positions(position.id, include_self=False)
        child_position_ids = [p.id for p in child_positions]

        # Get users in those positions
        subordinates = get_users_from_positions(child_position_ids)
        all_subordinates.extend(subordinates)

    # Remove duplicates
    unique_subordinates = list(set(all_subordinates))

    return unique_subordinates
