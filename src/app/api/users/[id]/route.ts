import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(user[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, email, password, balance, avatar } = body;

    const updates: any = {};

    if (name !== undefined) {
      if (typeof name === 'string') {
        updates.name = name.trim();
      } else {
        return NextResponse.json(
          {
            error: 'Name must be a string',
            code: 'INVALID_NAME',
          },
          { status: 400 }
        );
      }
    }

    if (email !== undefined) {
      if (typeof email === 'string' && email.includes('@')) {
        updates.email = email.toLowerCase().trim();
      } else {
        return NextResponse.json(
          {
            error: 'Valid email is required',
            code: 'INVALID_EMAIL',
          },
          { status: 400 }
        );
      }
    }

    if (password !== undefined) {
      if (typeof password === 'string' && password.length > 0) {
        updates.password = password;
      } else {
        return NextResponse.json(
          {
            error: 'Password cannot be empty',
            code: 'INVALID_PASSWORD',
          },
          { status: 400 }
        );
      }
    }

    if (balance !== undefined) {
      if (typeof balance === 'number') {
        updates.balance = balance;
      } else {
        return NextResponse.json(
          {
            error: 'Balance must be a number',
            code: 'INVALID_BALANCE',
          },
          { status: 400 }
        );
      }
    }

    if (avatar !== undefined) {
      if (typeof avatar === 'string' || avatar === null) {
        updates.avatar = avatar;
      } else {
        return NextResponse.json(
          {
            error: 'Avatar must be a string or null',
            code: 'INVALID_AVATAR',
          },
          { status: 400 }
        );
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          error: 'No valid fields to update',
          code: 'NO_UPDATE_FIELDS',
        },
        { status: 400 }
      );
    }

    const updatedUser = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedUser[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    await db.delete(users).where(eq(users.id, parseInt(id))).returning();

    return NextResponse.json(
      {
        message: 'User deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}