import React from 'react';
import { cn } from '@/lib/utils';
import {
	LucideIcon,
	PlusIcon,
} from 'lucide-react';

type ContactInfoProps = React.ComponentProps<'div'> & {
	icon: LucideIcon;
	label: string;
	value: string;
};

type ContactCardProps = React.ComponentProps<'div'> & {
	// Content props
	title?: string;
	description?: string;
	contactInfo?: ContactInfoProps[];
	formSectionClassName?: string;
};

export function ContactCard({
	title = 'Contact With Us',
	description = 'If you have any questions regarding our Services or need help, please fill out the form here. We do our best to respond within 1 business day.',
	contactInfo,
	className,
	formSectionClassName,
	children,
	...props
}: ContactCardProps) {
	return (
		<div
			className={cn(
				'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 relative grid h-full w-full shadow-lg rounded-xl overflow-hidden md:grid-cols-2 lg:grid-cols-3',
				className,
			)}
			{...props}
		>
			<PlusIcon className="absolute -top-3 -left-3 h-6 w-6 text-neutral-300 dark:text-neutral-700" />
			<PlusIcon className="absolute -top-3 -right-3 h-6 w-6 text-neutral-300 dark:text-neutral-700" />
			<PlusIcon className="absolute -bottom-3 -left-3 h-6 w-6 text-neutral-300 dark:text-neutral-700" />
			<PlusIcon className="absolute -right-3 -bottom-3 h-6 w-6 text-neutral-300 dark:text-neutral-700" />
			<div className="flex flex-col justify-between lg:col-span-2">
				<div className="relative h-full space-y-4 px-4 py-8 md:p-10">
					<h2 className="text-3xl font-extrabold md:text-4xl lg:text-5xl text-neutral-900 dark:text-neutral-50 mb-4">
						{title}
					</h2>
					<p className="text-neutral-600 dark:text-neutral-400 max-w-xl text-sm md:text-base lg:text-lg mb-8 leading-relaxed">
						{description}
					</p>
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
						{contactInfo?.map((info, index) => (
							<ContactInfo key={index} {...info} />
						))}
					</div>
				</div>
			</div>
			<div
				className={cn(
					'bg-neutral-50 dark:bg-neutral-950 flex h-full w-full items-center border-t border-neutral-200 dark:border-neutral-800 p-6 md:p-10 md:col-span-1 md:border-t-0 md:border-l',
					formSectionClassName,
				)}
			>
				{children}
			</div>
		</div>
	);
}

function ContactInfo({
	icon: Icon,
	label,
	value,
	className,
	...props
}: ContactInfoProps) {
	return (
		<div className={cn('flex flex-col sm:flex-row items-start sm:items-center gap-4 py-2', className)} {...props}>
			<div className="bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-xl p-3 shrink-0">
				<Icon className="h-6 w-6" />
			</div>
			<div>
				<p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-1">{label}</p>
				<p className="text-neutral-600 dark:text-neutral-400 text-sm">{value}</p>
			</div>
		</div>
	);
}
