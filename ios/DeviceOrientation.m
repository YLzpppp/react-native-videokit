//
//  DeviceOrientation.m
//  DeviceOrientation
//
//  Created by lzp on 2020/12/4.
//  Copyright © 2020 Facebook. All rights reserved.
//
#import "DeviceOrientation.h"

@implementation DeviceOrientation
{
	NSString *orientationStringValue;
}

static UIInterfaceOrientationMask _orientation = UIInterfaceOrientationMaskAllButUpsideDown;

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents
{
	return @[@"coarseOrientationDidChange",@"specificOrientationDidChange"];
}

// Will be called when this module's first listener is added.
-(void)startObserving {
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_emitEvent:) name:@"emitEvent" object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_deviceOrientationDidChange:) name:@"UIDeviceOrientationDidChangeNotification" object:nil];
}
// Will be called when this module's last listener is removed, or on dealloc.
-(void)stopObserving {
	[[NSNotificationCenter defaultCenter] removeObserver:self];
}
-(void) _emitEvent:(NSNotification *)notification {
	//	NSLog(@"发送事件给JavaScript内部处理函数拿到的payload是: %@",notification.userInfo);
	NSString *eventName = [notification.userInfo objectForKey:@"event-name"];
	NSDictionary *body = [notification.userInfo objectForKey:@"body"];
	[self sendEventWithName:eventName body:body];
}
- (void)_deviceOrientationDidChange:(NSNotification *)notification
{
	UIDeviceOrientation orientation = [[UIDevice currentDevice] orientation];
	NSString *specificOrientation = [self getSpecificOrientationStringValue:orientation];
	NSString *coarseOrientation = [self getCoarseOrientationStringValue:orientation];
	NSDictionary *specificPayload = @{
		@"event-name":@"specificOrientationDidChange",
		@"body":@{
				@"specificOrientation": specificOrientation
		}
	};
	NSDictionary *coarsePayload = @{
		@"event-name":@"coarseOrientationDidChange",
		@"body":@{
				@"coarseOrientation": coarseOrientation
		}
	};
	[DeviceOrientation emitEvent:specificPayload];
	[DeviceOrientation emitEvent:coarsePayload];
}
+(void)emitEvent:(NSDictionary *)payload
{
	[[NSNotificationCenter defaultCenter] postNotificationName:@"emitEvent" object:nil userInfo:payload];
}

+ (void)setOrientation: (UIInterfaceOrientationMask)orientation {
	_orientation = orientation;
}

+ (UIInterfaceOrientationMask)getOrientation {
	return _orientation;
}


- (NSString *)getCoarseOrientationStringValue: (UIDeviceOrientation)orientation {
	UIInterfaceOrientation interfaceOrientation = [[UIApplication sharedApplication] statusBarOrientation];
	switch (interfaceOrientation) {
		case UIInterfaceOrientationPortrait:
			orientationStringValue = @"PORTRAIT";
			break;
		case UIInterfaceOrientationLandscapeLeft:
			orientationStringValue = @"LANDSCAPE";
		case UIInterfaceOrientationLandscapeRight:
			orientationStringValue = @"LANDSCAPE";
			break;
		case UIInterfaceOrientationPortraitUpsideDown:
			orientationStringValue = @"PORTRAITUPSIDEDOWN";
			break;
		default:
			orientationStringValue = @"UNKNOWN";
			break;
	}
//	if(statusBarHidden == NO){
//
//	}else{
//		switch (orientation) {
//			case UIDeviceOrientationPortrait:
//				orientationStringValue = @"PORTRAIT";
//				break;
//			case UIDeviceOrientationLandscapeLeft:
//				orientationStringValue = @"LANDSCAPE";
//				break;
//			case UIDeviceOrientationLandscapeRight:
//				orientationStringValue = @"LANDSCAPE";
//				break;
//			case UIDeviceOrientationPortraitUpsideDown:
//				orientationStringValue = @"PORTRAITUPSIDEDOWN";
//				UIInterfaceOrientation o = [[UIApplication sharedApplication] statusBarOrientation];
//				NSLog(@"当前状态栏方向%ld ,竖直%ld, 竖直反向%ld",(long)o,(long)UIInterfaceOrientationPortrait,(long)UIInterfaceOrientationPortraitUpsideDown);
//				break;
//			default:
//				orientationStringValue = @"UNKNOWN";
//				break;
//		}
//	}
	return orientationStringValue;
}

- (NSString *)getSpecificOrientationStringValue: (UIDeviceOrientation)orientation {
	UIInterfaceOrientation interfaceOrientation = [[UIApplication sharedApplication] statusBarOrientation];
	switch (interfaceOrientation) {
		case UIInterfaceOrientationPortrait:
			orientationStringValue = @"PORTRAIT";
			break;
		case UIInterfaceOrientationLandscapeLeft:
			orientationStringValue = @"LANDSCAPE-LEFT";
		case UIInterfaceOrientationLandscapeRight:
			orientationStringValue = @"LANDSCAPE-RIGHT";
			break;
		case UIInterfaceOrientationPortraitUpsideDown:
			orientationStringValue = @"PORTRAITUPSIDEDOWN";
			break;
		default:
			orientationStringValue = @"UNKNOWN";
			break;
	}
//	switch (orientation) {
//		case UIDeviceOrientationPortrait:
//			orientationStringValue = @"PORTRAIT";
//			break;
//		case UIDeviceOrientationLandscapeLeft:
//			orientationStringValue = @"LANDSCAPE-LEFT";
//			break;
//		case UIDeviceOrientationLandscapeRight:
//			orientationStringValue = @"LANDSCAPE-RIGHT";
//			break;
//		case UIDeviceOrientationPortraitUpsideDown:
//			orientationStringValue = @"PORTRAITUPSIDEDOWN";
//			break;
//		default:
//			switch ([[UIApplication sharedApplication] statusBarOrientation]) {
//				case UIInterfaceOrientationPortrait:
//					orientationStringValue = @"PORTRAIT";
//					break;
//				case UIInterfaceOrientationLandscapeLeft:
//					orientationStringValue = @"LANDSCAPE-LEFT";
//				case UIInterfaceOrientationLandscapeRight:
//					orientationStringValue = @"LANDSCAPE-RIGHT";
//					break;
//				case UIInterfaceOrientationPortraitUpsideDown:
//
//					orientationStringValue = @"PORTRAITUPSIDEDOWN";
//					break;
//				default:
//					orientationStringValue = @"UNKNOWN";
//					break;
//			}
//			break;
//	}
	return orientationStringValue;
}

RCT_EXPORT_METHOD(getOrientation:(RCTResponseSenderBlock)callback)
{
	UIDeviceOrientation orientation = [[UIDevice currentDevice] orientation];
	NSString *orientationStringValue = [self getCoarseOrientationStringValue:orientation];
	callback(@[[NSNull null], orientationStringValue]);
}

RCT_EXPORT_METHOD(getSpecificOrientation:(RCTResponseSenderBlock)callback)
{
	UIDeviceOrientation orientation = [[UIDevice currentDevice] orientation];
	NSString *orientationStringValue = [self getSpecificOrientationStringValue:orientation];
	callback(@[[NSNull null], orientationStringValue]);
}

RCT_EXPORT_METHOD(lockToPortrait)
{
	[DeviceOrientation setOrientation:UIInterfaceOrientationMaskPortrait];
	[[NSOperationQueue mainQueue] addOperationWithBlock:^ {
		[[UIDevice currentDevice] setValue:[NSNumber numberWithInteger: UIInterfaceOrientationPortrait] forKey:@"orientation"];
		[[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
	}];
	
}

RCT_EXPORT_METHOD(lockToLandscape)
{
	UIDeviceOrientation orientation = [[UIDevice currentDevice] orientation];
	NSString *orientationStr = [self getSpecificOrientationStringValue:orientation];
	if ([orientationStr isEqualToString:@"LANDSCAPE-LEFT"]) {
		[DeviceOrientation setOrientation:UIInterfaceOrientationMaskLandscape];
		[[NSOperationQueue mainQueue] addOperationWithBlock:^ {
			[[UIDevice currentDevice] setValue:[NSNumber numberWithInteger: UIInterfaceOrientationLandscapeRight] forKey:@"orientation"];
			[[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
		}];
	} else {
		[DeviceOrientation setOrientation:UIInterfaceOrientationMaskLandscape];
		[[NSOperationQueue mainQueue] addOperationWithBlock:^ {
			[[UIDevice currentDevice] setValue:[NSNumber numberWithInteger: UIInterfaceOrientationLandscapeLeft] forKey:@"orientation"];
			[[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
		}];
	}
}

RCT_EXPORT_METHOD(lockToLandscapeLeft)
{
	[DeviceOrientation setOrientation:UIInterfaceOrientationMaskLandscapeLeft];
	[[NSOperationQueue mainQueue] addOperationWithBlock:^ {
		[[UIDevice currentDevice] setValue:[NSNumber numberWithInteger: UIInterfaceOrientationLandscapeLeft] forKey:@"orientation"];
		[[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
	}];
	
}

RCT_EXPORT_METHOD(lockToLandscapeRight)
{
	[DeviceOrientation setOrientation:UIInterfaceOrientationMaskLandscapeRight];
	[[NSOperationQueue mainQueue] addOperationWithBlock:^ {
		[[UIDevice currentDevice] setValue:[NSNumber numberWithInteger: UIInterfaceOrientationLandscapeRight] forKey:@"orientation"];
		[[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
	}];
	
}

RCT_EXPORT_METHOD(unlockAllOrientationsButUpsidedown)
{
	[[NSOperationQueue mainQueue] addOperationWithBlock:^ {
		[DeviceOrientation setOrientation:UIInterfaceOrientationMaskAllButUpsideDown];
		[[UIDevice currentDevice] setValue:[NSNumber numberWithInteger: UIInterfaceOrientationMaskAllButUpsideDown] forKey:@"orientation"];
		[[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
	}];
	
}
RCT_EXPORT_METHOD(unlockAllOrientations)
{
	[[NSOperationQueue mainQueue] addOperationWithBlock:^ {
		[DeviceOrientation setOrientation:UIInterfaceOrientationMaskAll];
		[[UIDevice currentDevice] setValue:[NSNumber numberWithInteger: UIInterfaceOrientationMaskAll] forKey:@"orientation"];
		[[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
	}];
}

//to let React Native know if your module needs to be initialized on the main thread
+ (BOOL)requiresMainQueueSetup
{
	return YES;
}
//if run on mainthread
- (dispatch_queue_t)methodQueue
{
	return dispatch_get_main_queue();
}

- (NSDictionary *)constantsToExport
{
	
	UIDeviceOrientation orientation = [[UIDevice currentDevice] orientation];
	NSString *orientationStringValue = [self getCoarseOrientationStringValue:orientation];
	
	return @{
		@"initialOrientation": orientationStringValue
	};
}

@end
