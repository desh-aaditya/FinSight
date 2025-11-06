import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { savingsGoals } from '@/db/schema';
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

    const goal = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.id, parseInt(id)))
      .limit(1);

    if (goal.length === 0) {
      return NextResponse.json(
        { error: 'Savings goal not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(goal[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
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

    const requestBody = await request.json();
    const { title, targetAmount, currentAmount, deadline, icon } = requestBody;

    const existingGoal = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.id, parseInt(id)))
      .limit(1);

    if (existingGoal.length === 0) {
      return NextResponse.json(
        { error: 'Savings goal not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) {
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title must be a non-empty string', code: 'INVALID_TITLE' },
          { status: 400 }
        );
      }
      updates.title = title.trim();
    }

    if (targetAmount !== undefined) {
      if (typeof targetAmount !== 'number' || targetAmount <= 0) {
        return NextResponse.json(
          { error: 'Target amount must be a positive number', code: 'INVALID_TARGET_AMOUNT' },
          { status: 400 }
        );
      }
      updates.targetAmount = targetAmount;
    }

    if (currentAmount !== undefined) {
      if (typeof currentAmount !== 'number' || currentAmount < 0) {
        return NextResponse.json(
          { error: 'Current amount must be a non-negative number', code: 'INVALID_CURRENT_AMOUNT' },
          { status: 400 }
        );
      }
      updates.currentAmount = currentAmount;
    }

    if (deadline !== undefined) {
      if (!deadline || typeof deadline !== 'string') {
        return NextResponse.json(
          { error: 'Deadline must be a valid date string', code: 'INVALID_DEADLINE' },
          { status: 400 }
        );
      }
      updates.deadline = deadline;
    }

    if (icon !== undefined) {
      if (icon !== null && typeof icon !== 'string') {
        return NextResponse.json(
          { error: 'Icon must be a string or null', code: 'INVALID_ICON' },
          { status: 400 }
        );
      }
      updates.icon = icon;
    }

    const updatedGoal = await db
      .update(savingsGoals)
      .set(updates)
      .where(eq(savingsGoals.id, parseInt(id)))
      .returning();

    if (updatedGoal.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update savings goal', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedGoal[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
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

    const existingGoal = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.id, parseInt(id)))
      .limit(1);

    if (existingGoal.length === 0) {
      return NextResponse.json(
        { error: 'Savings goal not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(savingsGoals)
      .where(eq(savingsGoals.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete savings goal', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Savings goal deleted successfully',
        deletedGoal: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}