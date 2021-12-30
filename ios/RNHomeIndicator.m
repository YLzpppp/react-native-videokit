//
//  RNHomeIndicator.m
//  Videokit
//
//  Created by lzp on 2021/2/20.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "RNHomeIndicator.h"
#import "RNVideoKitViewController.h"

@implementation RNHomeIndicator

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(setAutoHidden:(BOOL) hidden)
{
	UIViewController *rootvc = [UIApplication sharedApplication].delegate.window.rootViewController;
	
	if ([rootvc isKindOfClass:[RNVideoKitViewController class]]) {
		RNVideoKitViewController *vc = (RNVideoKitViewController *)rootvc;
		vc.autoHidden = hidden;
		if (@available (iOS 11.0,*)){
			[vc setNeedsUpdateOfHomeIndicatorAutoHidden];
		}
	}
}

- (dispatch_queue_t)methodQueue{
	return dispatch_get_main_queue();
}
@end
